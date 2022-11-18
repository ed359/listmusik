# -*- coding: utf-8 -*-
"""The Listmusik Collection

A Collection is an iterable container of Track objects. A Track contains the
metadata of a music file.

Attributes:
    Collection: Class definition
    Track: Class definition
"""
import logging
import os.path
from urllib.parse import unquote

from lxml import etree

from listmusik.location import normalise


class Collection:

    """An iterable collection of Tracks.

    A Collection has a basic api for adding and removing tracks and a method
    'to_etree' for conversion to an ElementTree ready for serialisation.

    Attributes:
        tag: The tag to use in xml representations of the data

    """

    tag = 'COLLECTION'

    def __init__(self, tracks=None):
        """Create a collection with an optional list of tracks"""
        self._tracks = [] if tracks is None else tracks

    def __iter__(self):
        """Iterate over the tracks in the collection"""
        yield from self._tracks

    def __len__(self):
        """Return the number of tracks"""
        return len(self._tracks)

    def append(self, track):
        """Add a track to the collection"""
        self._tracks.append(track)

    def append_if_new(self, track):
        """Add a track to the collection if one with the same location does not
        already exist
        """
        location = track.location
        conflict = None
        matching_tracks = [t for t in self if t.location == location]

        if len(matching_tracks) > 1:
            logging.warning('Collection contains multiple tracks at %s',
                            location)

        if len(matching_tracks) > 0:
            match = matching_tracks[0]
            logging.debug('Collection already contains %s', location)
            if match != track:
                logging.debug('Existing track and new track at this location' +
                              'differ')
                logging.debug('Existing  %s', str(match))
                logging.debug('     New  %s', str(track))
                conflict = match, track
        else:
            logging.debug('Appending new track with location ' +
                          '{}'.format(location))
            self._tracks.append(track)

        return conflict

    def clear(self):
        self._tracks = []

    def to_elem(self):
        """Convert the collection to an ElementTree element for serialisation"""
        elem = etree.Element(self.tag)
        elem.set('Length', str(len(self)))

        for track in self:
            elem.append(track.to_elem())

        return elem


class Track:

    """An object for the metadata of a music file.

    The location is stored as a uri with hostname starting 'file://localhost/'.

    Attributes:
        tag: The tag to use in xml representations of the data

    """

    tag = 'TRACK'

    # pylint: disable=R0913
    def __init__(self, name, artist, album, genre, date_added, location):
        """Create the track. Note that the location is normalised"""
        self._name = name
        self._artist = artist
        self._album = album
        self._genre = genre
        self._date_added = date_added
        self._location = self.normalise_location(location)

    def __eq__(self, other):
        """Compare tracks by attributes rather than python's id"""
        if isinstance(other, self.__class__):
            return self.attributes == other.attributes
        return NotImplemented

    def __ne__(self, other):
        """Define a non-equality test"""
        if isinstance(other, self.__class__):
            return not self.__eq__(other)
        return NotImplemented

    def __hash__(self):
        """Override the default hash behavior (which uses python's id)
        and hash the attributes instead.
        """
        return hash(tuple(sorted(self.attributes.items())))

    def __str__(self):
        return 'Track: {}'.format(str(self.attributes))

    def to_elem(self):
        """Convert the track to an ElementTree object for serialisation"""
        return etree.Element(self.tag, attrib=self.attributes)

    @property
    def attributes(self):
        """Return the track metadata as a dictionary"""
        return {
            'Name': self.name,
            'Artist': self.artist,
            'Album': self.album,
            'Genre': self.genre,
            'DateAdded': self.date_added,
            'Location': self.location
        }

    @property
    def name(self):
        """Get the name"""
        return self._name

    @property
    def artist(self):
        """Get the artist"""
        return self._artist

    @property
    def album(self):
        """Get the album"""
        return self._album

    @property
    def filename(self):
        """Get the filename"""
        return unquote(os.path.basename(self._location))

    @property
    def genre(self):
        """Get the genre"""
        return self._genre

    @property
    def date_added(self):
        """Get the date added"""
        return self._date_added

    @property
    def location(self):
        """Get the location"""
        return self._location

    @classmethod
    def from_elem(cls, elem):
        """Deserialise a track from a suitable ElementTree object"""

        name = elem.get('Name', '')
        artist = elem.get('Artist', '')
        album = elem.get('Album', '')
        genre = elem.get('Genre', '')
        date_added = elem.get('DateAdded', '')
        location = elem.get('Location')
        return Track(name, artist, album, genre, date_added, location)

    @classmethod
    def normalise_location(cls, location):
        """Collapse '.', '..' and symlinks in the location"""
        return normalise(location)

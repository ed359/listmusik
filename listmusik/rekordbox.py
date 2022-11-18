# -*- coding: utf-8 -*-
"""Import and export libraries in the Rekordbox format.

Attributes:
    to_file(lib, path): Write the Library as a rekordbox xml file to the path

    to_unicode(lib, url): Return the rekordbox xml as a string

    from_file(source): Parse a rekordbox xml file into a listmusik library
"""
import itertools
import logging

from lxml import etree

from listmusik import library


COLLECTION_TAG = 'COLLECTION'
NODE_TAG = 'NODE'
PLAYLISTS_TAG = 'PLAYLISTS'
PRODUCT_TAG = 'PRODUCT'
TRACK_TAG = 'TRACK'
FOLDER_TYPE = '0'
PLAYLIST_TYPE = '1'
ID_TYPE = '0'
# LOCATION_TYPE = '1'


def to_file(lib, file):
    """Write the library to a file (in binary mode) or filename"""
    _to_etree(lib).write(file,
                         encoding='UTF-8',
                         xml_declaration=True,
                         pretty_print=True)


def to_unicode(lib):
    """Get a string representation of the library without an xml declaration
    """
    return etree.tounicode(_to_etree(lib),
                           pretty_print=True)

# pylint: disable=R0912, R0914
def from_file(source):
    """Parse a rekordbox library from a file-like object, returning a listmusik
    library.
    """
    lib = library.Library()
    processing_subtree = None
    current_node = lib.playlists.root
    location_by_id = {}

    for event, elem in etree.iterparse(source,
                                       events=('start', 'end')):

        # To parse the playlists, build the tree with 'start' events
        if event == 'start':
            if elem.tag == COLLECTION_TAG:
                processing_subtree = COLLECTION_TAG
                logging.debug("Rekordbox collection found. Parsing "
                              "%s tracks", elem.get('Entries'))
            elif elem.tag == PLAYLISTS_TAG:
                processing_subtree = PLAYLISTS_TAG
                logging.debug("Rekordbox playlists found. Parsing tree.")
            # To parse the playlists, build the tree with 'start' events.
            # We already have the 'ROOT' folder which is identifiable by having
            # 'PLAYLISTS' as its parent
            elif (elem.tag == NODE_TAG and
                    not elem.getparent().tag == PLAYLISTS_TAG):
                if elem.get('Type') == FOLDER_TYPE:
                    next_node = library.Folder(elem.get('Name'))
                    current_node.append(next_node)
                    current_node = next_node
                elif elem.get('Type') == PLAYLIST_TYPE:
                    next_node = library.Playlist(elem.get('Name'))
                    current_node.append(next_node)
                    current_node = next_node
        elif event == 'end':
            if elem.tag == NODE_TAG:
                current_node = current_node.parent
            elif elem.tag == PRODUCT_TAG:
                name = elem.get('Name', None)
                version = elem.get('Version', None)
                company = elem.get('Company', None)
                logging.debug("Product: %s, version %s, by %s",
                              name, version, company)
                lib.product = library.Product(name, version, company)
            elif elem.tag == TRACK_TAG and processing_subtree == COLLECTION_TAG:

                track_id = elem.get('TrackID')
                rb_location = elem.get('Location')
                new_track = _lm_track_from_rb(elem)

                logging.debug("Found track: %s", rb_location)

                lib.collection.append(new_track)
                location_by_id[track_id] = rb_location
            elif elem.tag == TRACK_TAG and processing_subtree == PLAYLISTS_TAG:
                key = elem.get('Key')
                if elem.getparent().get('KeyType') == ID_TYPE:
                    key = location_by_id[key]
                current_node.append(library.Entry(key))

            # Clean up the processed elem after the 'end' event
            elem.clear()

    return lib


def _to_etree(lib):
    # Root element
    rb_root = etree.Element('DJ_PLAYLISTS', attrib={'Version': '1.0.0'})

    # Product element
    rb_product = lib.product.to_elem()
    rb_root.append(rb_product)

    # Collection element
    #   The rekordbox collection is almost the same as the listmusik collection
    #   we just rename 'Length' to 'Entries'
    rb_collection = lib.collection.to_elem()
    _rename_attribute(rb_collection, 'Length', 'Entries')

    #   for the tracks we add a 'TrackID'
    for track_id, track in zip(itertools.count(1), rb_collection):
        track.set('TrackID', str(track_id))

    rb_root.append(rb_collection)

    # Playlists element
    #   The rekordbox playlists are almost the same as the listmusik playlists
    rb_playlists = lib.playlists.to_elem()

    #   rename element FOLDER to NODE, set 'Type' to '0', and rename the
    #   attribute 'Length' to 'Count'
    for folder in rb_playlists.xpath('//{}'.format(library.Folder.tag)):
        folder.tag = 'NODE'
        folder.set('Type', '0')
        _rename_attribute(folder, 'Length', 'Count')

    #   rename element PLAYLIST to NODE, set 'Type' and 'KeyType' to '1' and
    #   rename the attribute 'Length' to 'Entries'
    for playlist in rb_playlists.xpath('//{}'.format(library.Playlist.tag)):
        playlist.tag = 'NODE'
        playlist.set('Type', '1')
        playlist.set('KeyType', '1')
        _rename_attribute(playlist, 'Length', 'Entries')

    #   rename element ENTRY to TRACK, and the attribute 'Location' to 'Key'
    for entry in rb_playlists.xpath('//{}'.format(library.Entry.tag)):
        entry.tag = 'TRACK'
        _rename_attribute(entry, 'Location', 'Key')

    rb_root.append(rb_playlists)

    return etree.ElementTree(rb_root)


def _rename_attribute(elem, old, new):
    elem.set(new, elem.attrib.pop(old))

def _lm_track_from_rb(elem):
    name = elem.get('Name', '')
    artist = elem.get('Artist', '')
    album = elem.get('Album', '')
    genre = elem.get('Genre', '')
    date_added = elem.get('DateAdded', '')
    location = elem.get('Location')

    return library.Track(name, artist, album, genre, date_added, location)

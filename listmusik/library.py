# -*- coding: utf-8 -*-
"""The Listmusik Library

A Library is a collection of tracks, a tree of playlists and associated
metadata.  This module contains defines the listmusik library and implements
methods for serialising to xml.

Attributes:
    __version__: The semantic version of the library code

    __format_version__: A semantic version of the library file format

    Library: Class definition

    to_file(lib, file): Write the Library as xml to a path or file-like object

    to_unicode(lib): Return the library as xml in a string

    from_file(source): Parse a path or file-like object to create a library

    Product: Class definition
"""
# import logging

from lxml import etree

from listmusik.collection import Collection, Track
from listmusik.playlists import Playlists, Folder, Playlist, Entry

__version__ = '0.0.1 (library)'
__format_version__ = '0.0.1 (format)'


class Library:

    """The main listmusik library class.

    A Library consists of:
        - a Product containing information about the software which created it,
        - a Collection of Track objects,
        - a Playlists object which contains a tree of Folder, Playlist and
          Entry objects.
    A Library may also have a 'base' from which one computes relatve paths
    where required.

    Library objects have a variety of methods which implement different ways
    of merging the content of another library, and a 'to_etree' method for
    serialising the library.

    """

    def __init__(self, name='Listmusik', version=__version__, company=None):
        """Create an empty library with trivial base"""
        self._base = '/'
        self._product = Product(name, version, company)
        self._collection = Collection()
        self._playlists = Playlists()

    def merge_collections(self, lib):
        """Adds to the collection all new tracks from the collection of
        another library. Returns a list of (old, new) conflict tuples.
        """
        conflicts = []
        for track in lib.collection:
            conflict = self.collection.append_if_new(track)
            if conflict is not None:
                conflicts.append(conflict)

        return conflicts

    def merge_playlists(self, lib, behaviour):
        """Merge the playlist trees of the libraries. Folders are merged, and
        conflicting playlists (same name and position on the tree) are
        handled according to the behaviour parameter,
            'keep'       the playlist in self is left untouched
            'overwrite'  the playlist in self is overwritten by the one in lib
            'append'     the playlist in lib is appended to the playlist in self
            'merge'      any additional tracks in playlists in lib are inserted
                         at approximately the correct position into the
                         corresponding playlist in self
        This method does not ensure the collection of self contains the required
        tracks, use merge_collections for this purpose.
        """
        self.playlists.root.merge(lib.playlists.root, behaviour)

    def to_etree(self):
        """Serialise the library to an etree"""
        root = etree.Element('LISTMUSIC_DATA')
        root.set('Version', __format_version__)

        root.append(self._product.to_elem())
        root.append(self._collection.to_elem())
        root.append(self._playlists.to_elem())

        return etree.ElementTree(root)

    @property
    def base(self):
        """Get the base"""
        return self._base

    @base.setter
    def base(self, value):
        """Set the base"""
        self._base = value

    @property
    def collection(self):
        """Get the collection"""
        return self._collection

    @property
    def playlists(self):
        """Get the playlists"""
        return self._playlists

    @property
    def product(self):
        """Get the product"""
        return self._product

    @product.setter
    def product(self, value):
        """Set the product"""
        self._product = value


def to_file(lib, file):
    """Write the library to a file (in binary mode) or filename"""
    lib.to_etree().write(file,
                         encoding='UTF-8',
                         xml_declaration=True,
                         pretty_print=True)


def to_unicode(lib):
    """Get a string representation of the library without an XML declaration
    """
    return etree.tounicode(lib.to_etree(),
                           pretty_print=True)


def from_file(source):
    """Load a library from a file-like object"""
    lib = Library()

    current_node = lib.playlists.root

    for event, elem in etree.iterparse(source,
                                       events=('start', 'end')):

        # To parse the playlists, build the tree with 'start' events.
        # We already have the 'ROOT' folder which is identifiable by having
        # 'PLAYLISTS' as its parent
        if event == 'start':
            if (elem.tag == Folder.tag and
                    not elem.getparent().tag == Playlists.tag):
                next_node = Folder(elem.get('Name'))
                current_node.append(next_node)
                current_node = next_node
            elif elem.tag == Playlist.tag:
                next_node = Playlist(elem.get('Name'))
                current_node.append(next_node)
                current_node = next_node
        elif event == 'end':
            if elem.tag == Folder.tag or elem.tag == Playlist.tag:
                current_node = current_node.parent
            elif elem.tag == Product.tag:
                lib.product = Product.from_elem(elem)
            elif elem.tag == Track.tag:
                lib.collection.append(Track.from_elem(elem))
            elif elem.tag == Entry.tag:
                current_node.append(Entry.from_elem(elem))

            # clean up the element after 'end'
            elem.clear()

    return lib


class Product:

    """Metadata for the product which created the library.

    Attributes:
        tag: The tag to use in xml representations of the data

    """

    tag = 'PRODUCT'

    def __init__(self, name=None, version=None, company=None):
        self._name = name
        self._version = version
        self._company = company

    def to_elem(self):
        """Convert the object to an ElementTree object for serialisation"""
        product = etree.Element('PRODUCT')

        if self.name is not None:
            product.set('Name', self.name)
        if self.version is not None:
            product.set('Version', self.version)
        if self.company is not None:
            product.set('Company', self.company)

        return product

    @classmethod
    def from_elem(cls, elem):
        """Deserialise a Product from a suitable ElementTree object"""
        return Product(elem.get('Name', None),
                       elem.get('Version', None),
                       elem.get('Company', None))

    @property
    def name(self):
        """Get the name"""
        return self._name

    @property
    def version(self):
        """Get the version"""
        return self._version

    @property
    def company(self):
        """Get the company"""
        return self._company

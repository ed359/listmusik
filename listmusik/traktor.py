# -*- coding: utf-8 -*-
"""Import and export libraries in the Traktor format.

Attributes:
    to_file(lib, path): Write the Library as a traktor xml file to the path

    to_unicode(lib, url): Return the traktor xml as a string

    from_file(source): Parse a traktor xml file into a listmusik library

TODO:
    - implement to_file and to_unicode via _to_etree
    - write tests
    - test corner cases of paths (volumes)
    - do date conversion
"""
# import itertools
import logging

from lxml import etree

from listmusik import library
import listmusik.location

COLLECTION_TAG = 'COLLECTION'
NODE_TAG = 'NODE'
PLAYLISTS_TAG = 'PLAYLISTS'
PRODUCT_TAG = 'HEAD'
TRACK_TAG = 'ENTRY'
ENTRY_TAG = 'PRIMARYKEY'
FOLDER_TYPE = 'FOLDER'
PLAYLIST_TYPE = 'PLAYLIST'

# def to_file(lib, file):
#     """Write the library to a file (in binary mode) or filename"""
#     _to_etree(lib).write(file,
#                          encoding='UTF-8',
#                          xml_declaration=True,
#                          pretty_print=True)
#
#
# def to_unicode(lib):
#     """Get a string representation of the library without an xml declaration
#     """
#     return etree.tounicode(_to_etree(lib),
#                            pretty_print=True)

# pylint: disable=R0912, R0914
def from_file(source):
    """Parse a traktor library from a file-like object, returning a listmusik
    library.
    """

    lib = library.Library()
    processing_subtree = None
    current_node = lib.playlists.root

    for event, elem in etree.iterparse(source,
                                       events=('start', 'end')):

        # To parse the playlists, build the tree with 'start' events
        if event == 'start':
            if elem.tag == COLLECTION_TAG:
                processing_subtree = COLLECTION_TAG
                logging.debug("Traktor collection found. Parsing "
                              "%s tracks", elem.get('Entries'))
            elif elem.tag == PLAYLISTS_TAG:
                processing_subtree = PLAYLISTS_TAG
                logging.debug("Traktor playlists found. Parsing tree.")
            # To parse the playlists, build the tree with 'start' events.
            # We already have the 'ROOT' folder which is identifiable by having
            # 'PLAYLISTS' as its parent
            elif (elem.tag == NODE_TAG and
                    not elem.getparent().tag == PLAYLISTS_TAG):
                if elem.get('TYPE') == FOLDER_TYPE:
                    next_node = library.Folder(elem.get('NAME'))
                    logging.debug('Current node: %s', current_node.name)
                    logging.debug('Found folder: %s', next_node.name)
                    current_node.append(next_node)
                    current_node = next_node
                elif elem.get('TYPE') == PLAYLIST_TYPE:
                    next_node = library.Playlist(elem.get('NAME'))
                    logging.debug('Current node: %s', current_node.name)
                    logging.debug('Found playlist: %s', next_node.name)
                    current_node.append(next_node)
                    current_node = next_node
        elif event == 'end':
            if elem.tag == NODE_TAG:
                current_node = current_node.parent
                elem.clear()
            elif elem.tag == PRODUCT_TAG:
                lib.product = _lm_product_from_tk(elem)
                logging.debug("Product: %s, by %s",
                              lib.product.name, lib.product.company)
                elem.clear()
            elif elem.tag == TRACK_TAG and processing_subtree == COLLECTION_TAG:
                new_track = _lm_track_from_tk(elem)
                logging.debug("Found track: %s", new_track.location)
                lib.collection.append(new_track)
                elem.clear()
            elif elem.tag == ENTRY_TAG and processing_subtree == PLAYLISTS_TAG:
                if elem.get('TYPE') == 'TRACK':
                    current_node.append(_lm_entry_from_tk(elem))
                elem.clear()

    return lib


# def _to_etree(lib):
#     pass


# def _rename_attribute(elem, old, new):
#     elem.set(new, elem.attrib.pop(old))

def _lm_entry_from_tk(elem):
    # TODO take care of the volume and think about windows paths
    os_path = '/Volumes/' + elem.get('KEY').replace('/:', '/')
    return library.Entry(listmusik.location.from_os_path(os_path))

def _lm_location_from_tk(elem):
    # TODO take care of the volume and think about windows paths
    os_path = elem.get('DIR').replace('/:', '/') + elem.get('FILE')

    return listmusik.location.from_os_path(os_path)

def _lm_product_from_tk(elem):
    name = elem.get('PROGRAM', None)
    company = elem.get('COMPANY', None)
    return library.Product(name, None, company)

def _lm_track_from_tk(elem):
    name = elem.get('TITLE', '')
    artist = elem.get('ARTIST', '')

    album_child = elem.find('ALBUM')
    album = album_child.get('TITLE', '') if album_child is not None else ''

    info_child = elem.find('INFO')
    genre = info_child.get('GENRE', '') if info_child is not None else ''
    # TODO: convert the import date to iso format
    date_added = info_child.get('IMPORT_DATE', '') if info_child is not None else ''

    location_child = elem.find('LOCATION')
    location = _lm_location_from_tk(location_child) if location_child is not None else ''

    return library.Track(name, artist, album, genre, date_added, location)

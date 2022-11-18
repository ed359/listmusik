# -*- coding: utf-8 -*-
"""Helper functions for dealing with paths and location in listmusik

"""

from urllib.parse import quote, unquote, urlparse, urlunparse
import os.path


def escape_for_os_path(string):
    return string.replace('/', '_')


def normalise(location):
    """Use os.path.realpath to normalise the given location.

    On macOS this should prevent duplicate locations arising from loops such
    as '/Volumes/Macintosh HD' == '/'.
    """
    parse_result = urlparse(location, allow_fragments=False)
    normalised_result = ('file', 'localhost',
                         quote(os.path.realpath(unquote(parse_result.path))),
                         '', '', '')
    return urlunparse(normalised_result)


def from_os_path(path, base=None):
    """Convert a path to a location.

    If the path is relative, base must be supplied for conversion to an absolute
    path.
    """

    if not os.path.isabs(path) and base is None:
        raise Exception('Problem of some sort')
    elif not os.path.isabs(path):
        base = os.path.abspath(base)
        path = os.path.realpath(os.path.join(base, path))

    return urlunparse(('file', 'localhost', quote(path), '', '', ''))


def rel_path_to_node_path(path):
    """Convert a relative path to a node path."""
    head, tail = os.path.split(path)
    if not head and tail == '.':
        return []  # avoid the root path being ['.']
    if head and head != path:
        return rel_path_to_node_path(head) + [tail]
    else:
        return [head or tail]


def to_os_path(location):
    """Normalise the location and return the absolute path"""
    parse_result = urlparse(location)
    return os.path.realpath(unquote(parse_result.path))


def to_rel_path(location, base):
    """Normalise the location and give the path relative to 'base'"""
    return os.path.relpath(to_os_path(location), base)

def to_rb_device_path(track):
    """Return the path rekordbox would give the track on a device"""
    # TODO currently changing the metadata after copying to the usb will
    # render this path incorrect. The file is not moved by rekordbox to reflect
    # its new metadata.
    truncate = lambda s: s[0:48]
    artist = truncate(track.artist) if track.artist is not '' else 'UnknownArtist'
    album = truncate(track.album) if track.album is not '' else 'UnknownAlbum'

    # Truncate the file name to 48 chars but preserving the extension
    truncate_filename = lambda s: s[0:44] + s[-4:]
    filename = track.filename if len(track.filename) < 49 else \
        truncate_filename(track.filename)

    # Escape characters in the path
    path_components = map(escape_for_os_path, ['Contents', artist, album, filename])
    return os.path.join(*path_components)

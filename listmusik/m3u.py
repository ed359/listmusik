# -*- coding: utf-8 -*-
"""Import and export libraries as a tree of folders and m3u playlists.

Attributes:
    to_file(lib, path): Write the Library as a tree of folders and m3u playlists
                        to the path, which must be a directory.

    to_rekordbox_device(lib, path): Write the Library as a tree of folders and
                        m3u playlists to the path, which must be a directory.

    to_unicode(lib, url): Return the tree as a string, with entries converted to
                          os paths unless the boolean url is True.

    from_file(source): Parse a directory tree reading in playlists to create a
                       library. Note that the collection will be empty.
"""
# import logging
import os
import os.path

from listmusik import library
from listmusik import location


def to_file(lib, path):
    """Convert the playlists tree in the library to a directory tree of m3u
    files
    """
    root_path = os.path.join(path, 'LM Playlists')

    def _path_function(playlist, loc):
        rel_path = location.to_rel_path(loc, lib.base)
        return os.path.join(*['..' for p in playlist.path], rel_path)

    for node in lib.playlists.root.iter_nodes():
        if node.__class__ == library.Folder:
            _export_folder(node, root_path)
        elif node.__class__ == library.Playlist:
            _export_playlist(node, root_path, _path_function)


def to_rekordbox_device(lib, path):
    """Convert the playlists tree in the library to a directory tree of m3u
    files which point to track location as rekordbox creates on a device
    """
    root_path = os.path.join(path, 'LM Playlists')

    def _path_function(playlist, loc):
        print(loc)
        track = [t for t in lib.collection if t.location == loc].pop()
        rb_device_path = location.to_rb_device_path(track)
        return os.path.join(*['..' for p in playlist.path], rb_device_path)

    for node in lib.playlists.root.iter_nodes():
        if node.__class__ == library.Folder:
            _export_folder(node, root_path)
        elif node.__class__ == library.Playlist:
            # TODO: replace entries with tracks in the playlist
            _export_playlist(node, root_path, _path_function)


def to_unicode(lib, url=False):
    """Get a string representation of the playlists in the library as a
    directory tree of m3u files
    """
    return lib.playlists.root.to_unicode([], url, lib.base)


def from_file(path):
    """Parse a directory tree containing m3u playlists and return a listmusik
    library of the referenced files.
    """
    if not os.path.isdir(path):
        raise Exception('{} is not a directory. You must import m3u from a '
                        'directory'.format(path))

    lib = library.Library()

    for abs_path, dirs, files in os.walk(path):
        rel_path = os.path.relpath(abs_path, path)
        node_path = location.rel_path_to_node_path(rel_path)
        # print('at rel_path:  ' + rel_path)
        # print('at node_path: ' + str(node_path))
        parent = lib.playlists.lookup_nodes(node_path)
        for dir_name in dirs:
            # print('found directory: {}'.format(os.path.join(rel_path, dir_name)))
            parent.append(library.Folder(dir_name))

        for playlist_file in [f for f in files if _is_m3u_file(f)]:
            # print('found playlist: {}'.format(playlist_file))
            playlist_path = os.path.join(abs_path, playlist_file)
            parent.append(library.Playlist.from_file(playlist_path))

    return lib


def _export_folder(folder, root_path):
    tree_path = list(map(location.escape_for_os_path, folder.path))
    dir_path = os.path.join(root_path, *tree_path)
    os.makedirs(dir_path, exist_ok=True)


def _export_playlist(playlist, root_path, path_function):
    """Write a playlist to the correct location under the root path.

    path_function must be of type (playlist, location) -> path
    """
    # print('exporting {} of path {}'.format(playlist.tag, playlist.path))
    tree_path = list(map(location.escape_for_os_path, playlist.path))
    file_path = os.path.join(root_path, *tree_path) + '.m3u8'

    with open(file_path, 'w+') as playlist_file:
        playlist_file.write('# created by listmusik\n')
        for entry in playlist:
            playlist_file.write(path_function(playlist, entry.location))
            playlist_file.write('\n')

def _is_m3u_file(name):
    return name.endswith(('.m3u', '.m3u8'))

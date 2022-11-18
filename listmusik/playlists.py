# -*- coding: utf-8 -*-
"""Listmusik Playlists

The Playlists object holds a rooted tree of Folder and Playlist nodes. A
Playlist contains holds Entry objects.

Attributes:
    Playlists: Class definition
    Node: Base class for Folder and Playlist
    Folder: Class definition
    Playlist: Class definition
    Entry: Class definition

"""
import logging
import os.path
from difflib import SequenceMatcher

from lxml import etree

import listmusik.location


class Playlists:

    """An container for the root of the playlist tree.

    Has an api for iterating through the tree, with iter_nodes returning only
    Folder and Playlist objects, but iter_all returning Entries too.

    Attributes:
        tag: The tag to use in xml representations of the data

    """

    tag = 'PLAYLISTS'

    def __init__(self):
        self._root = Folder('ROOT')

    def lookup_nodes(self, path):
        """Return the node at a given path, which must be expressed as a list"""
        for node in self._root.iter_nodes():
            if node.path == path:
                return node

    def lookup_all(self, path):
        """Return the node or entry at a given path, which must be expressed as
        a list
        """
        for node_or_entry in self._root.iter_all():
            if node_or_entry.path == path:
                return node_or_entry

    def to_elem(self):
        """Convert the object to an ElementTree object for serialisation"""
        playlists = etree.Element(Playlists.tag)
        playlists.append(self._root.to_elem())

        return playlists

    @property
    def root(self):
        """Get the root"""
        return self._root


class Node:

    """A base class for Folder and Playlist in the tree.

    Iterating over a node is not recursive, merely yielding the immediate
    children.  For recusive iteration use iter_nodes and iter_all.  Nodes have
    some of the list api, but not all of it.

    Attributes:
        tag: The tag to use in xml representations of the data

    """

    tag = 'NODE'

    def __init__(self, name):
        self._name = name
        self._nodes = []
        self._parent = None
        self._path = []

    def __getitem__(self, index):
        if isinstance(index, str):
            return [n for n in self._nodes if n.name == index].pop()
        else:
            return self._nodes[index]

    def __iter__(self):
        """Iterate only over the immediate children, not over the subtree"""
        yield from self._nodes

    def __len__(self):
        return len(self._nodes)

    def append(self, child):
        """Append a child"""
        child.parent = self
        self._nodes.append(child)

    def iter_nodes(self):
        """Iterate only over the the subtree, ignoring non-Node objects"""
        yield self
        for node in self:
            if isinstance(node, Node):
                yield from node.iter_nodes()

    def iter_all(self):
        """Iterate only over the the subtree, including Entry objects"""
        yield self
        for node in self:
            yield from node.iter_all()

    def pop(self):
        """Pop a child off the node"""
        return self._nodes.pop()

    def to_elem(self):
        """Convert the subtree to an ElementTree object for serialisation"""
        elem = etree.Element(self.tag)
        elem.set('Name', self.name)
        elem.set('Length', str(len(self)))

        for node in self:
            elem.append(node.to_elem())

        return elem

    def to_unicode(self, spine=None, url=False, base='/'):
        """Convert the subtree to a string"""
        # construct the current node
        if spine is None or spine == []:
            spine = []
            spine_str = ''
            last_str = ''
        else:
            last = spine[-1]
            spine_str = ''.join(map(lambda l: '  ' if l else '│ ', spine[:-1]))
            last_str = '└─' if last else '├─'
        string = spine_str + last_str + '{}\n'.format(self.name)

        # construct the child nodes
        if self._nodes:
            final_node = self._nodes[-1]
            for node in self:
                last = (node == final_node)
                string += node.to_unicode(spine + [last], url, base)
        return string

    @property
    def name(self):
        """Get the name"""
        return self._name

    @property
    def nodes(self):
        """Get the child nodes"""
        return self._nodes

    @property
    def parent(self):
        """Get the parent node"""
        return self._parent

    @parent.setter
    def parent(self, value):
        """Set the parent node"""
        self._parent = value
        self._path = value.path.copy()
        self._path.append(self.name)

    @property
    def path(self):
        """Get the path"""
        return self._path


class Folder(Node):

    """A class for folders of playlists.

    Implements a merge method.

    Attributes:
        tag: The tag to use in xml representations of the data

    """

    tag = 'FOLDER'

    def merge(self, folder, behaviour):

        """Merge another Folder into this one.

        Keep playlists from both folders, merging playlists of the same name
        according to the speficied behaviour.

        """

        for new in folder:
            name_matches = [old for old in self if old.name == new.name]
            if name_matches:
                old = name_matches[0]
                if old.__class__ == new.__class__:
                    old.merge(new, behaviour)
                else:
                    logging.warning('Folder and Playlist of same name: %s',
                                    new.name)
                    # TODO work out what to do here...
            else:
                self.append(new)


class Playlist(Node):

    """A class for playlists.

    Implements a merge method.

    Attributes:
        tag: The tag to use in xml representations of the data

    """

    tag = 'PLAYLIST'

    def merge(self, playlist, behaviour):
        """Merge another playlist into this one.

        The parameter 'behaviour' must be one of:
            - 'keep'        ignore the other playlist
            - 'overwrite'   overwrite this playlist with the other
            - 'append'      append the other playlist to this one
            - 'merge'       merge the two playlists without creating duplicates

        """

        if behaviour == 'keep':
            pass
        elif behaviour == 'overwrite':
            self._nodes = playlist.nodes
        elif behaviour == 'append':
            self._nodes.extend(playlist.nodes)
        elif behaviour == 'merge':
            self._nodes = _merge_sequences(self.nodes, playlist.nodes)

    @classmethod
    def from_file(cls, source):
        """Create a playlist from a path or file-like object holding m3u data"""
        # deal with path or file object
        if not hasattr(source, 'read'):
            filename = source
            source = open(source, 'r')
            close_source_after_read = True
        else:
            filename = source.name
            close_source_after_read = False

        base, name = os.path.split(os.path.splitext(filename)[0])

        playlist = Playlist(name)

        # iterate over lines
        for line in source:
            # ignoring comments
            if not line.startswith('#'):
                # omit the trailing '\n'
                playlist.append(Entry.from_os_path(line[:-1], base))

        if close_source_after_read:
            source.close()

        return playlist


class Entry:
    """An object for an entry in a playlist.

    An Entry contains a location, a uri with hostname starting
    'file://localhost/'.

    Attributes:
        tag: The tag to use in xml representations of the data

    """

    tag = 'ENTRY'

    def __init__(self, location):
        self._location = listmusik.location.normalise(location)
        self._parent = None
        self._path = []

    def __eq__(self, other):
        """Compare entries by location rather than python's id"""
        if isinstance(other, self.__class__):
            return self.location == other.location
        return NotImplemented

    def __ne__(self, other):
        """Define a non-equality test"""
        if isinstance(other, self.__class__):
            return not self.__eq__(other)
        return NotImplemented

    def __hash__(self):
        """Override the default hash behavior (which uses python's id)
        and hash the location instead.
        """
        return hash(self.location)

    def __str__(self):
        return 'Entry: {}'.format(self.location)

    def to_elem(self):
        """Convert the Entry to an ElementTree object for serialisation"""
        entry = etree.Element(Entry.tag)
        entry.set('Location', self._location)

        return entry

    def to_unicode(self, spine=None, url=False, base='/'):
        """Convert the Entry to a string"""
        if spine is None or spine == []:
            spine = []
            spine_str = ''
            last_str = ''
        else:
            last = spine[-1]
            spine_str = ''.join(map(lambda l: '  ' if l else '│ ', spine[:-1]))
            last_str = '└─' if last else '├─'

        if url:
            location_str = self.location
        else:
            location_str = listmusik.location.to_rel_path(self.location, base)

        return spine_str + last_str + '{}\n'.format(location_str)

    def iter_all(self):
        """Return the entry when iterating, for comaptability with Node"""
        yield self

    @property
    def location(self):
        """Get the location"""
        return self._location

    @property
    def name(self):
        """Expose the location as name, for comaptability with Node"""
        return self._location

    @property
    def parent(self):
        """Get the containing playlist, for comaptability with Node"""
        return self._parent

    @parent.setter
    def parent(self, value):
        """Set the containing playlist, for comaptability with Node"""
        self._parent = value
        self._path = value.path.copy()
        self._path.append(self.name)

    @property
    def path(self):
        """Get the path, for comaptability with Node"""
        return None

    @classmethod
    def from_elem(cls, elem):
        """Deserialise an Entry from a suitable ElementTree object"""
        location = elem.get('Location')
        return Entry(location)

    @classmethod
    def from_os_path(cls, path, base=None):
        """Create an entry from an os path"""
        return Entry(listmusik.location.from_os_path(path, base))


def _merge_sequences(seq1, seq2):
    seq_matcher = SequenceMatcher(None, seq1, seq2)
    merged = []
    for (operation, start1, end1, start2, end2) in seq_matcher.get_opcodes():
        if operation == 'equal' or operation == 'delete':
            # The range appears in both sequences, or only the first
            merged += seq1[start1:end1]
        elif operation == 'insert':
            # The range appears in only the second sequence
            merged += seq2[start2:end2]
        elif operation == 'replace':
            # There are different ranges in each sequence, so add both
            merged += seq1[start1:end1]
            merged += seq2[start2:end2]
    return merged

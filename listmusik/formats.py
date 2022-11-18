# -*- coding: utf-8 -*-
"""Helper functions for dealing with the different formats listmusik supports

"""

import os.path

from listmusik import library
from listmusik import m3u
from listmusik import rekordbox


LM_STRINGS = ['<LISTMUSIK_DATA']
RB_STRINGS = ['<DJ_PLAYLISTS']

# pylint: disable=E0602
IDENTIFIERS = [map(lambda s: lambda p: initial_contains(p, s), LM_STRINGS),
               [os.path.isdir],
               map(lambda s: lambda p: initial_contains(p, s), RB_STRINGS)]

PARSERS = [library.from_file,
           m3u.from_file,
           rekordbox.from_file]

NAMES = ['listmusik', 'm3u', 'rekordbox']


def try_parse(path):
    """Parse the path with whichever parser is thought to be best"""
    for parser, idfuncs in zip(PARSERS, IDENTIFIERS):
        for idfunc in idfuncs:
            if idfunc(path):
                return parser(path)


def guess_format(path):
    """Return the name of the format thought to exist at the path"""
    for name, idfuncs in zip(NAMES, IDENTIFIERS):
        for idfunc in idfuncs:
            if idfunc(path):
                return name


def initial_contains(path, string, count=200):
    """Check whether a file contains a string in the first count bytes"""
    if not os.path.isfile(path):
        return False

    with open(path, 'r') as file_object:
        data = file_object.read(count)

    if data.find(string) > -1:
        return True

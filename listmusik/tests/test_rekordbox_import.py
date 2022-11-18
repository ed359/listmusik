# -*- coding: utf-8 -*-
# pylint: disable=C0111, C0301
from io import BytesIO

from listmusik import library
from listmusik import rekordbox
import libs


def test_import_empty():
    lib = rekordbox.from_file(BytesIO(bytes(libs.RB_EMPTY, 'UTF-8')))
    assert library.to_unicode(lib) == libs.LM_EMPTY


def test_import_track():
    lib = rekordbox.from_file(BytesIO(bytes(libs.RB_TRACK, 'UTF-8')))
    assert library.to_unicode(lib) == libs.LM_TRACK


def test_import_playlist_tree():
    lib = rekordbox.from_file(BytesIO(bytes(libs.RB_TREE, 'UTF-8')))
    assert library.to_unicode(lib) == libs.LM_TREE


def test_import_playlist_entries():
    lib = rekordbox.from_file(BytesIO(bytes(libs.RB_ENTRIES_ID, 'UTF-8')))
    assert library.to_unicode(lib) == libs.LM_ENTRIES


def test_import_playlist_all():
    lib = rekordbox.from_file(BytesIO(bytes(libs.RB_ALL, 'UTF-8')))
    assert library.to_unicode(lib) == libs.LM_ALL

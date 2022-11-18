# -*- coding: utf-8 -*-
# pylint: disable=C0111, C0301
from io import BytesIO

from listmusik import library
import libs


def test_import_empty():
    lib = library.from_file(BytesIO(bytes(libs.LM_EMPTY, 'UTF-8')))
    assert library.to_unicode(lib) == libs.LM_EMPTY


def test_import_track():
    lib = library.from_file(BytesIO(bytes(libs.LM_TRACK, 'UTF-8')))
    assert library.to_unicode(lib) == libs.LM_TRACK


def test_import_playlist_tree():
    lib = library.from_file(BytesIO(bytes(libs.LM_TREE, 'UTF-8')))
    assert library.to_unicode(lib) == libs.LM_TREE


def test_import_playlist_entries():
    lib = library.from_file(BytesIO(bytes(libs.LM_ENTRIES, 'UTF-8')))
    assert library.to_unicode(lib) == libs.LM_ENTRIES


def test_import_all():
    lib = library.from_file(BytesIO(bytes(libs.LM_ALL, 'UTF-8')))
    assert library.to_unicode(lib) == libs.LM_ALL

# -*- coding: utf-8 -*-
# pylint: disable=C0111, C0301
from listmusik import rekordbox
import libs


def test_export_empty():
    assert rekordbox.to_unicode(libs.get_empty()) == libs.RB_EMPTY


def test_export_track():
    assert rekordbox.to_unicode(libs.get_track()) == libs.RB_TRACK


def test_export_tree():
    assert rekordbox.to_unicode(libs.get_tree()) == libs.RB_TREE


def test_export_entries():
    assert rekordbox.to_unicode(libs.get_entries()) == libs.RB_ENTRIES_LOC


def test_export_all():
    assert rekordbox.to_unicode(libs.get_all()) == libs.RB_ALL


def test_export_corners():
    assert rekordbox.to_unicode(libs.get_corners()) == libs.RB_CORNERS

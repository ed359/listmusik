# -*- coding: utf-8 -*-
# pylint: disable=C0111, C0301
from listmusik import library
import libs


def test_export_empty():
    assert library.to_unicode(libs.get_empty()) == libs.LM_EMPTY


def test_export_track():
    assert library.to_unicode(libs.get_track()) == libs.LM_TRACK


def test_export_tree():
    assert library.to_unicode(libs.get_tree()) == libs.LM_TREE


def test_export_entries():
    assert library.to_unicode(libs.get_entries()) == libs.LM_ENTRIES


def test_export_all():
    assert library.to_unicode(libs.get_all()) == libs.LM_ALL


def test_export_corners():
    assert library.to_unicode(libs.get_corners()) == libs.LM_CORNERS

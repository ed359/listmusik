# -*- coding: utf-8 -*-
# pylint: disable=C0111, C0301, C0103
from listmusik import library, m3u
import libs

def _go(lib1, p):
    lib1.collection.clear()
    m3u.to_file(lib1, p)

    lib2 = m3u.from_file(p.join('LM Playlists'))
    lib2.product = library.Product('listmusik-test', None, None)

    # TODO find something to replace ths ugly hack
    xml1 = library.to_unicode(lib1).replace('file://localhost',
                                            'file://localhost' + str(p) )
    assert xml1 == library.to_unicode(lib2)

def test_empty(tmpdir):
    p = tmpdir.mkdir('empty')
    _go(libs.get_empty(), p)


def test_track(tmpdir):
    p = tmpdir.mkdir('track')
    _go(libs.get_track(), p)


def test_tree(tmpdir):
    p = tmpdir.mkdir('tree')
    _go(libs.get_tree(), p)


def test_entries(tmpdir):
    p = tmpdir.mkdir('entries')
    _go(libs.get_entries(), p)


def test_all(tmpdir):
    p = tmpdir.mkdir('all')
    _go(libs.get_all(), p)


def test_corners(tmpdir):
    p = tmpdir.mkdir('corners')
    _go(libs.get_corners(), p)

# -*- coding: utf-8 -*-
# pylint: disable=C0111, C0301
from listmusik import library

def get_empty():
    return library.Library('listmusik-test', None, None)

LM_EMPTY = ('<LISTMUSIC_DATA Version="{}">\n'
             '  <PRODUCT Name="listmusik-test"/>\n'
             '  <COLLECTION Length="0"/>\n'
             '  <PLAYLISTS>\n'
             '    <FOLDER Name="ROOT" Length="0"/>\n'
             '  </PLAYLISTS>\n'
             '</LISTMUSIC_DATA>\n'.format(library.__format_version__))

RB_EMPTY = ('<DJ_PLAYLISTS Version="1.0.0">\n'
            '  <PRODUCT Name="listmusik-test"/>\n'
            '  <COLLECTION Entries="0"/>\n'
            '  <PLAYLISTS>\n'
            '    <NODE Name="ROOT" Type="0" Count="0"/>\n'
            '  </PLAYLISTS>\n'
            '</DJ_PLAYLISTS>\n')

def get_track():
    lib = library.Library('listmusik-test', None, None)
    lib.collection.append(library.Track('Test Name', 'Test Artist',
                                        'Test Album', 'Test Genre',
                                        'Test Date', 'file://localhost/test.test'))
    return lib

LM_TRACK = ('<LISTMUSIC_DATA Version="{}">\n'
             '  <PRODUCT Name="listmusik-test"/>\n'
             '  <COLLECTION Length="1">\n'
             '    <TRACK Album="Test Album" Artist="Test Artist" DateAdded="Test Date" Genre="Test Genre" Location="file://localhost/test.test" Name="Test Name"/>\n'
             '  </COLLECTION>\n'
             '  <PLAYLISTS>\n'
             '    <FOLDER Name="ROOT" Length="0"/>\n'
             '  </PLAYLISTS>\n'
             '</LISTMUSIC_DATA>\n'.format(library.__format_version__))

RB_TRACK = ('<DJ_PLAYLISTS Version="1.0.0">\n'
            '  <PRODUCT Name="listmusik-test"/>\n'
            '  <COLLECTION Entries="1">\n'
            '    <TRACK Album="Test Album" Artist="Test Artist" DateAdded="Test Date" Genre="Test Genre" Location="file://localhost/test.test" Name="Test Name" TrackID="1"/>\n'
            '  </COLLECTION>\n'
            '  <PLAYLISTS>\n'
            '    <NODE Name="ROOT" Type="0" Count="0"/>\n'
            '  </PLAYLISTS>\n'
            '</DJ_PLAYLISTS>\n')

def get_tree():
    lib = library.Library('listmusik-test', None, None)
    lib.playlists.root.append(library.Folder('ROOT_F1'))
    lib.playlists.root.append(library.Folder('ROOT_F2'))
    lib.playlists.root.append(library.Playlist('ROOT_P3'))
    lib.playlists.root['ROOT_F1'].append(library.Playlist('ROOT_F1_P1'))
    lib.playlists.root['ROOT_F2'].append(library.Playlist('ROOT_F2_P2'))
    return lib

LM_TREE = ('<LISTMUSIC_DATA Version="{}">\n'
            '  <PRODUCT Name="listmusik-test"/>\n'
            '  <COLLECTION Length="0"/>\n'
            '  <PLAYLISTS>\n'
            '    <FOLDER Name="ROOT" Length="3">\n'
            '      <FOLDER Name="ROOT_F1" Length="1">\n'
            '        <PLAYLIST Name="ROOT_F1_P1" Length="0"/>\n'
            '      </FOLDER>\n'
            '      <FOLDER Name="ROOT_F2" Length="1">\n'
            '        <PLAYLIST Name="ROOT_F2_P2" Length="0"/>\n'
            '      </FOLDER>\n'
            '      <PLAYLIST Name="ROOT_P3" Length="0"/>\n'
            '    </FOLDER>\n'
            '  </PLAYLISTS>\n'
            '</LISTMUSIC_DATA>\n'.format(library.__format_version__))

RB_TREE = ('<DJ_PLAYLISTS Version="1.0.0">\n'
            '  <PRODUCT Name="listmusik-test"/>\n'
            '  <COLLECTION Entries="0"/>\n'
            '  <PLAYLISTS>\n'
            '    <NODE Name="ROOT" Type="0" Count="3">\n'
            '      <NODE Name="ROOT_F1" Type="0" Count="1">\n'
            '        <NODE Name="ROOT_F1_P1" Type="1" KeyType="1" Entries="0"/>\n'
            '      </NODE>\n'
            '      <NODE Name="ROOT_F2" Type="0" Count="1">\n'
            '        <NODE Name="ROOT_F2_P2" Type="1" KeyType="1" Entries="0"/>\n'
            '      </NODE>\n'
            '      <NODE Name="ROOT_P3" Type="1" KeyType="1" Entries="0"/>\n'
            '    </NODE>\n'
            '  </PLAYLISTS>\n'
            '</DJ_PLAYLISTS>\n')

def get_entries():
    lib = library.Library('listmusik-test', None, None)
    lib.collection.append(_gen_track(1))
    lib.collection.append(_gen_track(2))
    lib.playlists.root.append(library.Playlist('ROOT_P1'))
    lib.playlists.root['ROOT_P1'].append(library.Entry('file://localhost/fake1.file'))
    lib.playlists.root['ROOT_P1'].append(library.Entry('file://localhost/fake2.file'))
    return lib

LM_ENTRIES = ('<LISTMUSIC_DATA Version="{}">\n'
               '  <PRODUCT Name="listmusik-test"/>\n'
               '  <COLLECTION Length="2">\n'
               '    <TRACK Album="Album1" Artist="Artist1" DateAdded="Date1" Genre="Genre1" Location="file://localhost/fake1.file" Name="Name1"/>\n'
               '    <TRACK Album="Album2" Artist="Artist2" DateAdded="Date2" Genre="Genre2" Location="file://localhost/fake2.file" Name="Name2"/>\n'
               '  </COLLECTION>\n'
               '  <PLAYLISTS>\n'
               '    <FOLDER Name="ROOT" Length="1">\n'
               '      <PLAYLIST Name="ROOT_P1" Length="2">\n'
               '        <ENTRY Location="file://localhost/fake1.file"/>\n'
               '        <ENTRY Location="file://localhost/fake2.file"/>\n'
               '      </PLAYLIST>\n'
               '    </FOLDER>\n'
               '  </PLAYLISTS>\n'
               '</LISTMUSIC_DATA>\n'.format(library.__format_version__))

RB_ENTRIES_ID = ('<DJ_PLAYLISTS Version="1.0.0">\n'
            '  <PRODUCT Name="listmusik-test"/>\n'
            '  <COLLECTION Entries="2">\n'
            '    <TRACK Album="Album1" Artist="Artist1" DateAdded="Date1" Genre="Genre1" Location="file://localhost/fake1.file" Name="Name1" TrackID="1"/>\n'
            '    <TRACK Album="Album2" Artist="Artist2" DateAdded="Date2" Genre="Genre2" Location="file://localhost/fake2.file" Name="Name2" TrackID="2"/>\n'
            '  </COLLECTION>\n'
            '  <PLAYLISTS>\n'
            '    <NODE Name="ROOT" Type="0" Count="1">\n'
            '      <NODE Name="ROOT_P1" Type="1" KeyType="0" Entries="2">\n'
            '        <TRACK Key="1"/>\n'
            '        <TRACK Key="2"/>\n'
            '      </NODE>\n'
            '    </NODE>\n'
            '  </PLAYLISTS>\n'
            '</DJ_PLAYLISTS>\n')

RB_ENTRIES_LOC = ('<DJ_PLAYLISTS Version="1.0.0">\n'
            '  <PRODUCT Name="listmusik-test"/>\n'
            '  <COLLECTION Entries="2">\n'
            '    <TRACK Album="Album1" Artist="Artist1" DateAdded="Date1" Genre="Genre1" Location="file://localhost/fake1.file" Name="Name1" TrackID="1"/>\n'
            '    <TRACK Album="Album2" Artist="Artist2" DateAdded="Date2" Genre="Genre2" Location="file://localhost/fake2.file" Name="Name2" TrackID="2"/>\n'
            '  </COLLECTION>\n'
            '  <PLAYLISTS>\n'
            '    <NODE Name="ROOT" Type="0" Count="1">\n'
            '      <NODE Name="ROOT_P1" Type="1" KeyType="1" Entries="2">\n'
            '        <TRACK Key="file://localhost/fake1.file"/>\n'
            '        <TRACK Key="file://localhost/fake2.file"/>\n'
            '      </NODE>\n'
            '    </NODE>\n'
            '  </PLAYLISTS>\n'
            '</DJ_PLAYLISTS>\n')

def get_all():
    lib = library.Library('listmusik-test', None, None)
    for i in range(1, 8):
        lib.collection.append(_gen_track(i))
    lib.playlists.root.append(library.Folder('ROOT_F1'))
    lib.playlists.root['ROOT_F1'].append(library.Playlist('ROOT_F1_P1'))
    lib.playlists.root['ROOT_F1']['ROOT_F1_P1'].append(_gen_entry(1))
    lib.playlists.root['ROOT_F1']['ROOT_F1_P1'].append(_gen_entry(2))
    lib.playlists.root['ROOT_F1'].append(library.Playlist('ROOT_F1_P2'))
    lib.playlists.root['ROOT_F1']['ROOT_F1_P2'].append(_gen_entry(3))
    lib.playlists.root['ROOT_F1']['ROOT_F1_P2'].append(_gen_entry(4))
    lib.playlists.root.append(library.Folder('ROOT_F2'))
    lib.playlists.root['ROOT_F2'].append(library.Playlist('ROOT_F2_P3'))
    lib.playlists.root.append(library.Playlist('ROOT_P4'))
    lib.playlists.root['ROOT_P4'].append(_gen_entry(5))
    lib.playlists.root['ROOT_P4'].append(_gen_entry(6))
    lib.playlists.root['ROOT_P4'].append(_gen_entry(7))

    return lib

LM_ALL = ('<LISTMUSIC_DATA Version="{}">\n'
           '  <PRODUCT Name="listmusik-test"/>\n'
           '  <COLLECTION Length="7">\n'
           '    <TRACK Album="Album1" Artist="Artist1" DateAdded="Date1" Genre="Genre1" Location="file://localhost/fake1.file" Name="Name1"/>\n'
           '    <TRACK Album="Album2" Artist="Artist2" DateAdded="Date2" Genre="Genre2" Location="file://localhost/fake2.file" Name="Name2"/>\n'
           '    <TRACK Album="Album3" Artist="Artist3" DateAdded="Date3" Genre="Genre3" Location="file://localhost/fake3.file" Name="Name3"/>\n'
           '    <TRACK Album="Album4" Artist="Artist4" DateAdded="Date4" Genre="Genre4" Location="file://localhost/fake4.file" Name="Name4"/>\n'
           '    <TRACK Album="Album5" Artist="Artist5" DateAdded="Date5" Genre="Genre5" Location="file://localhost/fake5.file" Name="Name5"/>\n'
           '    <TRACK Album="Album6" Artist="Artist6" DateAdded="Date6" Genre="Genre6" Location="file://localhost/fake6.file" Name="Name6"/>\n'
           '    <TRACK Album="Album7" Artist="Artist7" DateAdded="Date7" Genre="Genre7" Location="file://localhost/fake7.file" Name="Name7"/>\n'
           '  </COLLECTION>\n'
           '  <PLAYLISTS>\n'
           '    <FOLDER Name="ROOT" Length="3">\n'
           '      <FOLDER Name="ROOT_F1" Length="2">\n'
           '        <PLAYLIST Name="ROOT_F1_P1" Length="2">\n'
           '          <ENTRY Location="file://localhost/fake1.file"/>\n'
           '          <ENTRY Location="file://localhost/fake2.file"/>\n'
           '        </PLAYLIST>\n'
           '        <PLAYLIST Name="ROOT_F1_P2" Length="2">\n'
           '          <ENTRY Location="file://localhost/fake3.file"/>\n'
           '          <ENTRY Location="file://localhost/fake4.file"/>\n'
           '        </PLAYLIST>\n'
           '      </FOLDER>\n'
           '      <FOLDER Name="ROOT_F2" Length="1">\n'
           '        <PLAYLIST Name="ROOT_F2_P3" Length="0"/>\n'
           '      </FOLDER>\n'
           '      <PLAYLIST Name="ROOT_P4" Length="3">\n'
           '        <ENTRY Location="file://localhost/fake5.file"/>\n'
           '        <ENTRY Location="file://localhost/fake6.file"/>\n'
           '        <ENTRY Location="file://localhost/fake7.file"/>\n'
           '      </PLAYLIST>\n'
           '    </FOLDER>\n'
           '  </PLAYLISTS>\n'
           '</LISTMUSIC_DATA>\n'.format(library.__format_version__))

RB_ALL = ('<DJ_PLAYLISTS Version="1.0.0">\n'
            '  <PRODUCT Name="listmusik-test"/>\n'
            '  <COLLECTION Entries="7">\n'
            '    <TRACK Album="Album1" Artist="Artist1" DateAdded="Date1" Genre="Genre1" Location="file://localhost/fake1.file" Name="Name1" TrackID="1"/>\n'
            '    <TRACK Album="Album2" Artist="Artist2" DateAdded="Date2" Genre="Genre2" Location="file://localhost/fake2.file" Name="Name2" TrackID="2"/>\n'
            '    <TRACK Album="Album3" Artist="Artist3" DateAdded="Date3" Genre="Genre3" Location="file://localhost/fake3.file" Name="Name3" TrackID="3"/>\n'
            '    <TRACK Album="Album4" Artist="Artist4" DateAdded="Date4" Genre="Genre4" Location="file://localhost/fake4.file" Name="Name4" TrackID="4"/>\n'
            '    <TRACK Album="Album5" Artist="Artist5" DateAdded="Date5" Genre="Genre5" Location="file://localhost/fake5.file" Name="Name5" TrackID="5"/>\n'
            '    <TRACK Album="Album6" Artist="Artist6" DateAdded="Date6" Genre="Genre6" Location="file://localhost/fake6.file" Name="Name6" TrackID="6"/>\n'
            '    <TRACK Album="Album7" Artist="Artist7" DateAdded="Date7" Genre="Genre7" Location="file://localhost/fake7.file" Name="Name7" TrackID="7"/>\n'
            '  </COLLECTION>\n'
            '  <PLAYLISTS>\n'
            '    <NODE Name="ROOT" Type="0" Count="3">\n'
            '      <NODE Name="ROOT_F1" Type="0" Count="2">\n'
            '        <NODE Name="ROOT_F1_P1" Type="1" KeyType="1" Entries="2">\n'
            '          <TRACK Key="file://localhost/fake1.file"/>\n'
            '          <TRACK Key="file://localhost/fake2.file"/>\n'
            '        </NODE>\n'
            '        <NODE Name="ROOT_F1_P2" Type="1" KeyType="1" Entries="2">\n'
            '          <TRACK Key="file://localhost/fake3.file"/>\n'
            '          <TRACK Key="file://localhost/fake4.file"/>\n'
            '        </NODE>\n'
            '      </NODE>\n'
            '      <NODE Name="ROOT_F2" Type="0" Count="1">\n'
            '        <NODE Name="ROOT_F2_P3" Type="1" KeyType="1" Entries="0"/>\n'
            '      </NODE>\n'
            '      <NODE Name="ROOT_P4" Type="1" KeyType="1" Entries="3">\n'
            '        <TRACK Key="file://localhost/fake5.file"/>\n'
            '        <TRACK Key="file://localhost/fake6.file"/>\n'
            '        <TRACK Key="file://localhost/fake7.file"/>\n'
            '      </NODE>\n'
            '    </NODE>\n'
            '  </PLAYLISTS>\n'
            '</DJ_PLAYLISTS>\n')

def get_corners():
    lib = library.Library('listmusik-test', None, None)
    lib.collection.append(library.Track('Name1', 'Artist1',
                                        'Album that is longer than 48 Unicode Üñîçòdē Chärãćtęrß', 'Genre1',
                                        'Date1', 'file://localhost/fake1.file'))
    lib.collection.append(library.Track('Name2', 'Artist2',
                                        'Album with specials #$%_*.@/\\//', 'Genre2',
                                        'Date2', 'file://localhost/fake2.file'))
    lib.collection.append(library.Track('Name3', 'Artist that is longer than 48 Unicode Üñîçòdē Chärãćtęrß',
                                        'Album3', 'Genre3',
                                        'Date3', 'file://localhost/fake3.file'))
    return lib


LM_CORNERS = ('<LISTMUSIC_DATA Version="{}">\n'
           '  <PRODUCT Name="listmusik-test"/>\n'
           '  <COLLECTION Length="3">\n'
           '    <TRACK Album="Album that is longer than 48 Unicode Üñîçòdē Chärãćtęrß" Artist="Artist1" DateAdded="Date1" Genre="Genre1" Location="file://localhost/fake1.file" Name="Name1"/>\n'
           '    <TRACK Album="Album with specials #$%_*.@/\\//" Artist="Artist2" DateAdded="Date2" Genre="Genre2" Location="file://localhost/fake2.file" Name="Name2"/>\n'
           '    <TRACK Album="Album3" Artist="Artist that is longer than 48 Unicode Üñîçòdē Chärãćtęrß" DateAdded="Date3" Genre="Genre3" Location="file://localhost/fake3.file" Name="Name3"/>\n'
           '  </COLLECTION>\n'
           '  <PLAYLISTS>\n'
           '    <FOLDER Name="ROOT" Length="0"/>\n'
           '  </PLAYLISTS>\n'
           '</LISTMUSIC_DATA>\n'.format(library.__format_version__))


RB_CORNERS = ('<DJ_PLAYLISTS Version="1.0.0">\n'
                '  <PRODUCT Name="listmusik-test"/>\n'
                '  <COLLECTION Entries="3">\n'
                '    <TRACK Album="Album that is longer than 48 Unicode Üñîçòdē Chärãćtęrß" Artist="Artist1" DateAdded="Date1" Genre="Genre1" Location="file://localhost/fake1.file" Name="Name1" TrackID="1"/>\n'
                '    <TRACK Album="Album with specials #$%_*.@/\\//" Artist="Artist2" DateAdded="Date2" Genre="Genre2" Location="file://localhost/fake2.file" Name="Name2" TrackID="2"/>\n'
                '    <TRACK Album="Album3" Artist="Artist that is longer than 48 Unicode Üñîçòdē Chärãćtęrß" DateAdded="Date3" Genre="Genre3" Location="file://localhost/fake3.file" Name="Name3" TrackID="3"/>\n'
                '  </COLLECTION>\n'
                '  <PLAYLISTS>\n'
                '    <NODE Name="ROOT" Type="0" Count="0"/>\n'
                '  </PLAYLISTS>\n'
                '</DJ_PLAYLISTS>\n')


def _gen_track(index):
    fields = list(map(lambda s: s + str(index),
                      ['Name', 'Artist', 'Album', 'Genre', 'Date', 'file://localhost/fake']))
    fields[-1] += '.file'
    return library.Track(*fields)


def _gen_entry(index):
    return library.Entry(_gen_track(index).location)

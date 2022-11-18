import os
import os.path
from importlib import reload

from listmusik import library
from listmusik import m3u
from listmusik import rekordbox
from listmusik import traktor


bigl = library.from_file('./bigl.xml')
dirr = '/Users/ewan/Music/listmusik playlists'

listmusik
=========

Listmusik is written in Python.

Prerequisites
-------------

  - Python 3.6
  - the dependencies of lxml

Download
--------

  - check out the git repo
  - (recommended) set up a virtualenv using python3.6
      - `pip install virtualenv`
      - `virtualenv -p python3.6 env`
      - 'source ./env/bin/activate'
  - `pip install -r requirements.txt`
  - `pip install -e .`

TODO
----

  - Work out a way of testing the M3U import/export better.  Hardcoded paths to
    sample files suck.
  - Think of how to solve the 'reordbox doesn't move files' problem.  Basically,
    rekordbox puts files in Contents/artist/album/filename stricture on an
    external device.  But if you later change the artist or album metadata it
    doesn't move the file.  So doing 'export to rekordbox device' from listmusik
    results in the wrong path.
  - Fix the 'slashes in node names' bug.  How should we handle exporting to m3u
    names with slashes?

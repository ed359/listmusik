#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import argparse
import logging

from listmusik import formats
from listmusik import library
from listmusik import rekordbox

__version__ = '0.0.1 (cli)'


def main(args):
    # Setup logging
    if args.verbose:
        loglevel = logging.DEBUG
    else:
        loglevel = logging.INFO

    logging.basicConfig(format='%(levelname)-5s %(message)s', level=loglevel)

    logging.info('Welcome to listmusik')
    logging.info('  processing files: {}'.format(args.sources))
    logging.info('  with behaviour: {},'.format(args.behaviour))
    logging.info('  output format: {},'.format(args.format))
    logging.info('  to output: {}.'.format(args.output.name))

    lib = library.Library(__name__, __version__)
    for path in args.sources:
        new_lib = formats.parse(path)
        lib.merge_collections(new_lib)
        lib.merge_playlists(new_lib, args.behaviour)

    lib.to_file(args.output)

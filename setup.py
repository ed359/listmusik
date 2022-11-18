# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

with open('README.rst') as f:
    readme = f.read()

with open('LICENSE') as f:
    pkg_license = f.read()

setup(
    name='listmusik',
    version="0.0.1 (package)",
    description='A simple music organiser for DJs',
    long_description=readme,
    author='Ewan Davies',
    author_email='ewan.davies@gmail.com',
    url='https://github.com/ed359/listmusik',
    license=pkg_license,
    packages=find_packages(exclude=('tests', 'docs'))
)

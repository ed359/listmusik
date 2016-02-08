listmusik
=========

A simple music organiser

## Releases

see [releases](https://github.com/ed359/listmusik/releases)

## Development

### Prerequisites 

listmusik is a nw.js (node-webkit) application which requires node and ```npm``` for development.

Node packages required:

  - ```$ npm install -g bower```
  - ```$ npm install -g gulp-cli```
  - ```$ npm install -g nw-gyp```

Command-line dependencies:
  - FFmpeg or libav must be installed on the system, and the ffmpeg command-line tool available in the $PATH

### Download

  clone the git repo
  
### Install Dependencies

  - ```$ npm install``` to install and compile everything
  - ```$ gulp postinstall``` is automatically run to install and compile app dependencies

### Go

  - ```$ gulp run``` runs the app
  - ```$ gulp lint``` runs jshint
  - ```$ gulp deploy``` builds packages for release

## Release History

  - 0.2.0 File and playlist reading feature-complete
  - 0.1.0 Initial release

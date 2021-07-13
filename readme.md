## MapEditor

A simple map editing tool for my game; written in Typescript and built with a custom webpack config.

![Picture of map editor](https://i.imgur.com/HWteMCf.png)

## Usage:

- left click to place a cell
- right click to delete a cell (replace it with air)
- scroll wheel to zoom in/out
- space to save
- q, w, e to select Dirt, Grass, and Resource blocks, respectively (subsequent left-clicks will place this cell type)

## Installation

Requires npm

1. `git clone https://github.com/japraj/mapEditor.git`
2. `cd mapEditor`
3. install dependencies with `npm install`
4. start a dev server on port 9000 with `npm start`; to change the port, edit the arg passed to `webpack serve` in package.json

## TODO

- fix app breaking on resize
- add camera system, controlled with arrow keys

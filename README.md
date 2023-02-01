# lectures
This repository include interactive web applications (HTML and Javascript) to demonstrate the methods discussed in the lectures I am holding at the Friedrich-Alexander-Universität (FAU). I will start with one of the lectures in the course *geometric modeling*. Lectures for other courses will follow in future commits. 

There are a lot of duplicated code. I hope this will become better with future commits, as far I have time to redesign the code. The web applications are interactive. I am using *D3* for 2D graphics and *three.js* for surfaces. Therefore, feel free to use the mouse and menus to interact with the visualization.

It is recommended to start with the file *index.html* in the root/main folder in order to easily navigate through all the applications implemented for the different lectures. In order to run the code, a *live-server* is required. I personally use Visual Studio Code and live-server plugin. 

## Folder common
This folder contains functions that that are required by some of the implementations in the different topics. One example are functions for solving simple linear systems or computing the inverse of a matrix.

## Folder gm
This folder contains the web applications implemented for the lectures corresponding to the course in *Geometric Modeling*.

## Folder gp
This folder contains the web applications implemented for the lectures corresponding to the course in *Geometry Processing*.

## Folder infovis
This folder contains the web applications implemented for the lectures corresponding to the course in *Information Visualization*.

## Remark
I have been having problems with the CDNs, in particular *unpkg* with *D3*. If a web application does not work, please, just edit the *html* file and comment in a different CDN.
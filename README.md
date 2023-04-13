# lectures
This repository contains the HTML and Javascript code implementing algorithms discussed in some of the lectures 
in geometry processing and information visualization. This way, the code and some background information 
about the algorithms can be freely accessed also from outside the University.

There is a lot of duplicated code, but it is being re-engineered. Thus it will become better in the future. 
The web applications are interactive and based on <strong>D3</strong> for 2D graphics and 
<strong>three.js</strong> for surfaces. It is strongly recommended to interact with the visualizations by 
selecting and dragging points or by zooming and rotating the 3D geometry. Some of the applications also 
include a user interface. The code is, at this moment, indeed buggy. The code was not implemented for 
industrial usage.  

## Folder common
This folder contains functions that that are required by some of the implementations in the different topics. One example are functions for solving simple linear systems or computing the inverse of a matrix.

## Folder gm
This folder contains the web applications implemented for the lectures corresponding to the course in *Geometric Modeling*.

## Folder gp
This folder contains the web applications implemented for the lectures corresponding to the course in *Geometry Processing*.

## Folder infovis
This folder contains the web applications implemented for the lectures corresponding to the course in *Information Visualization*.

## Remark
I have had problems with the CDNs, particularly *unpkg* with *D3*. If a web application does not work, please edit the *html* or
 *JavaScript* file and comment in a different CDN.

## Disclaimer
Some of the functions used in this project were implemented within the project. For example, JavaScript 
does not have a priority queue. In such cases, we copy an implementation from the Internet and modify 
and adapt it. We mention the credits in the JavaScript file. We hope we have done everything right.
# lectures
This repository contains the HTML and Javascript code implementing algorithms discussed in some geometric modeling, 
geometry processing, and information visualization lectures. This way, the code and some background information 
about the algorithms can be freely accessed also from outside the University. Please feel free to visit the website 
<a href="https://rogrosso.github.io/lectures/">https://rogrosso.github.io/lectures</a> that shows these algorithms 
online.

The web applications are interactive and based on D3 for 2D graphics and three.js for surfaces. It is strongly 
recommended to interact with the visualizations by selecting and dragging points, zooming, and rotating the 3D 
geometry. Some of the applications also include a simple user interface. The code was not implemented for 
industrial usage or optimized for performance, which makes the implementations much easier to read and understand.

**Note:** The code was only tested with the Edge and Chrome browsers. 

The website is organized into three folders containing the algorithms implemented for three lectures. 
The folders are the following:

## Folder gm, Geometric Modeling
This section implements algorithms for polynomial curves, Bézier- and B-Spline curves. There are also 
implementations of algorithms for tensor product and subdivision surfaces. 

## Folder gp, Geometry Processing
This section contains basic algorithms for geometry processing, such as point cloud registration, 
surface reconstruction, fairing and remeshing, mesh deformation (ARAP), and parametrization.

## Folder infovis
This section demonstrates some visualization algorithms for color manipulation, multivariate data, 
network analysis, visualization, hierarchies, and text visualization.

## Disclaimer
This project aims to implement all functions and data structures required, up to the libraries 
for data visualization and HTML processing, such as formulas and code highlighting. Nevertheless, 
there always will be exemplary implementations of fundamental algorithms that one borrows from the 
open-source community. Credits will be included in the corresponding file whenever third-party 
software is used.
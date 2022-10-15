# Visual Story - Kharkiv's Destroyed Infrastructure

We are documenting the destruction of Kharkiv's civilian infrastructure – universities, museums, place of worship, residential apartment buildings, cemeteries, etc. Albeit digitally, our aim is to give readers the experience of walking through the city.

The research combines testimonies, on-site damage assessments, videos of the shelling incident, before/after pictures, and satellite imagery.


## Dependencies

 - Node.js and NPM

 - Python 3

 - [FFmpeg](https://ffmpeg.org/download.html) 


## Mise-en-place

### NPM dependencies

To install all the webapp dependencies run, 

        npm i

### Webapp Open Graph 

Set your title, description and logos the [index.html](./index.html) file. 


## Building the App

To build the webpp run,

        npm run build

To see what it looks like run the following command and open the url in your browser,

        npm run preview


## Hosting the webapp

To host the webpp, copy all the files from the [dist](./dist/) folder on your server. 

*If you plan to host the static files under a subdomain. Edit the [index.html](./dist/index.html) file to ensure your endpoints point to it.

        ...

        <!-- MS Tile - for Microsoft apps-->
        <meta name="msapplication-TileImage" content="https://jeanromainroy.com/projects/kharkiv/logo.jpg">


        <script type="module" crossorigin src="/projects/kharkiv/assets/index.bf88d454.js"></script>
        <link rel="stylesheet" href="/projects/kharkiv/assets/index.d575cb38.css">


## Satellite Imagery

Satellite imagery of Kharkiv is provided by [Planet](https://www.planet.com/) as part of their [Disaster Data Programme](https://www.planet.com/disasterdata/). Here are some basic details about the instrumentation, 

| | |
| --- | --- |
| Source | [SkySat Collect](https://developers.planet.com/docs/data/skysatcollect/) |
| Ground Sampling Distance | 0.7m |
| Pixel Resolution | 0.5m |

Polygons of the incident areas were cropped before and after the shelling. Then, a command-line [script](./data/satellite-imagery/rasters/info.sh) was used to extract the [coordinates](./data/satellite-imagery/rasters/info.json) of each image. 


## Styling

Black and white except for visual indicators. Images & videos are formatted as follows,

    canvas:      6 x 4 (a.r 1.5)
    image:       4 x 3 (a.r 1.333)


## Authors

- [Jean-Romain Roy](https://jeanromainroy.com/), on-site assessment, codebase & author

- [Emmanuel Roy](https://manuroy.ca/), article styling & infrastructure expertise

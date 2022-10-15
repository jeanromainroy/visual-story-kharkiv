<script>

    // properties
    export let texts;
    export let incidents;

    // sort incidents
    const sorted_incidents = incidents.sort((a, b) => {
        return date_to_number(a['properties']['DATE']) - date_to_number(b['properties']['DATE'])
    });

    // import config
    import { EDITABLE_TEXT, CENTER_LAT, CENTER_LNG } from './config.js';

    // import libs
    import { convertDMS, bbox_center_point, bbox_to_gmap_link, lat_lng_to_gmap_link } from './libs/geospatial.js';
    import { date_to_number, monthNames_fr } from './libs/datetime.js';

    // import components
    import Canvas from './components/Canvas/Canvas.svelte';
    import TextBlock from './components/TextBlock.svelte';
    import Quote from './components/Quote.svelte';
    import Video from './components/Video.svelte';
    import RasterSlider from './components/RasterSlider.svelte';

    // create today
    const today = new Date();
    const today_str = `${today.getDate()} ${monthNames_fr[today.getMonth()]}`

    // helper functions
    function bbox_to_title(bbox){

        // compute lat lng
        const { lat, lng } = bbox_center_point(bbox);

        // convert to DMS
        const str = convertDMS(lat, lng);

        return str;
    }

</script>


<div class="section-spacer-top"></div>


<!-- INTRODUCTION -->
<section data-id="first">

    <!-- Cover -->
    <div class="header">

        <!-- Video -->
        <Video src="context/intro/cover.mp4"/>

        <!-- Titles -->
        <div class="titles">
            <p class="title">Assiégé</p>
            <p class="subtitle">
                <a target="_blank" href={lat_lng_to_gmap_link(CENTER_LAT, CENTER_LNG)}>
                    {@html convertDMS(CENTER_LAT, CENTER_LNG)}
                </a>                        
            </p>
            <p class="subtitle">
                <a target="_blank" href="https://t.me/dnepr_operativ/8417">
                    24 février
                </a>
            </p>   
        </div>
    </div>
    

    <!-- Content -->
    <div class="sub-container">

        <!-- Text -->
        <TextBlock id="intro-1" texts={texts} editable={EDITABLE_TEXT}/>

        <!-- Image -->
        <div class="gallery-text-top-down">
            <Canvas 
                caption="<a target='_blank' href='https://t.me/xc_kharkiv/38567'>24 février</a>"
                asset_url="context/intro/video.mp4"
            />
        </div>

        <!-- Text -->
        <TextBlock id="intro-2" texts={texts} editable={EDITABLE_TEXT}/>
        
        <!-- Quote -->
        <Quote
            author="<a target='_blank' href='https://www.ukrinform.net/rubric-ato/3505811-pavlo-fedosenko-hero-of-ukraine.html'>Pavlo Fedosenko, Commandant de la 92e brigade mécanisée</a>"
            text="Les Russes étaient déjà à Kharkiv. Il y avait des combats de rue à rue dans la ville. Tout le monde se battait pour Kharkiv. Les forces armées ukrainiennes, la défense territoriale, la garde nationale, la police et des volontaires."
        />
    </div>
</section>


<!-- spacer -->
<div class="section-spacer"></div>


<!-- INCIDENTS -->
{#each sorted_incidents as incident}
    <section data-id={incident['properties']['ID']} >

        <!-- Cover -->
        <div class="header">

            <!-- Video -->
            <Video src={incident['properties']['COVER']}/>

            <!-- Titles -->
            <div class="titles">
                <p class="title">{incident['properties']['TITLE']}</p>
                <p class="subtitle">
                    <a target="_blank" href={bbox_to_gmap_link(incident['properties']['SATELLITE']['bbox'])}>
                        {@html bbox_to_title(incident['properties']['SATELLITE']['bbox'])}
                    </a>                        
                </p>
                <p class="subtitle">
                    <a target="_blank" href={incident['properties']['REF'][0]}>
                        {incident['properties']['SUBTITLE']}
                    </a>
                </p>   
            </div>
        </div>
        

        <!-- Content -->
        <div class="sub-container">

            <!-- Text -->
            <TextBlock id={`${incident['properties']['TEXT_KEY']}-1`} texts={texts} editable={EDITABLE_TEXT}/>

            <!-- Image -->
            <div class="gallery-text-top-down">
                <Canvas 
                    caption={incident['properties']['DATA'][0]['caption']} 
                    asset_url={incident['properties']['DATA'][0]['asset']} 
                    objects_url={incident['properties']['DATA'][0]['objects']} 
                    animation_url={incident['properties']['DATA'][0]['animation']}
                />
            </div>

            <!-- Text -->
            <TextBlock id={`${incident['properties']['TEXT_KEY']}-2`} texts={texts} editable={EDITABLE_TEXT}/>
            

            <!-- Satellite Imagery -->
            {#if incident['properties']['SATELLITE'] !== undefined && incident['properties']['SATELLITE']['after'] !== undefined}
                <RasterSlider
                    incident={incident}
                />
            {/if}
            

            <!-- Quote -->
            {#if incident['properties']['QUOTE'] !== undefined}
                <Quote
                    author={incident['properties']['QUOTE']['author']}
                    text={incident['properties']['QUOTE']['text']}
                />
            {/if}

        </div>
    </section>

    <!-- spacer -->
    <div class="section-spacer"></div>

{/each}



<!-- CONCLUSION -->
<section data-id="last">

    <!-- Cover -->
    <div class="header">

        <!-- Video -->
        <Video src="context/intro/cover.mp4"/>

        <!-- Titles -->
        <div class="titles">
            <p class="title">Conclusion</p>
            <p class="subtitle">
                <a target="_blank" href={lat_lng_to_gmap_link(CENTER_LAT, CENTER_LNG)}>
                    {@html convertDMS(CENTER_LAT, CENTER_LNG)}
                </a>                        
            </p>
            <p class="subtitle">
                <a target="_blank" href="https://t.me/dnepr_operativ/8417">
                    {today_str}
                </a>
            </p>   
        </div>
    </div>
    

    <!-- Content -->
    <div class="sub-container">

        <!-- Text -->
        <!-- <TextBlock id="conclu-1" texts={texts} editable={EDITABLE_TEXT}/> -->

        <!-- Image -->
        <div class="gallery-text-top-down">
            <Canvas 
                asset_url="context/conclu/photo.jpg"
            />
        </div>


        <!-- Quote -->
        <Quote
            author="Graffiti sur canevas d'impact de bombes à sous-munitions."
            text="Nous n'oublierons pas ces fleurs."
        />

    </div>

</section>


<!-- spacer -->
<div class="section-spacer"></div>


<style>

    a {
        text-decoration: none;
    }

    section {
        margin: 0px;
        padding: 0px;
        box-shadow: var(--box-shadow-dark);
        background: white;
        display: flex;
    }

    .sub-container {
        padding: 2.5rem;
        z-index: 2;
        background-color: transparent;
        margin-top: 200px;
        width: 100%;
    }

    .header {
        position: absolute;
        z-index: 1;
        width: var(--content-width-with-map);
        height: 200px;
        overflow: hidden;
    }

    .header .titles {
        position: absolute;
        padding: 1.5rem;
        bottom: 0px;      
    }

    
    .section-spacer {
        height: var(--space-between-sections);
    }

    .section-spacer-top {
        height: var(--space-between-sections);
    }


    .title {
        font-family: var(--font-ebgaramond);
        margin: 0px;
        padding: 0px;
        color: white;
        font-size: var(--font-size-very-large);
        line-height: 3.15rem;
    }

    .subtitle {
        font-family: var(--font-ebgaramond);
        margin: 0px;
        padding: 0px;
        color: white;
        font-size: var(--font-size-large);        
    }


    .subtitle a {
        font-family: var(--font-ebgaramond);
        margin: 0px;
        padding: 0px;
        color: white;
        font-size: var(--font-size-large);        
    }

    .gallery-text-top-down {
        justify-content: center; 
        margin: 0px auto;
    }

    /* on small screen */
    @media only screen and (max-width: 600px) {
        section {
            margin: 0px;
            margin-bottom: 2rem;
            box-shadow: unset;           
        }

        .sub-container {
            padding: 1.5rem;
        }

        .header .titles {
            padding: 16px;
        }

        .title {
            font-size: var(--font-size-very-large-small);
        }

        .header {
            width: 100vw;
        }

        .section-spacer-top {
            height: 0px;
        }
    }

</style>
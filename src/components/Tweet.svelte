<!-- 
If you want to embed actual tweets you need to add the following line to your "index.html" file,
    <script src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

To keep the same picture format, 
    https://publish.twitter.com/
-->

<script>
    
    // import libs
    import { onMount } from "svelte";

    // properties
    export let url;
    export let with_media = false;
    export let local_url = null;
    
    // display
    let visible = false;

    // parameters
    const cards = with_media ? undefined: 'hidden';
    const conversation = 'none';
    const theme = undefined;
    const linkColor = undefined;
    const width = undefined;
    const align = 'center';
    const lang = 'en';
    const dnt = true;

    // variables
    const uid = Math.round(Math.random() * 100000.0);
    const container_id = `tweet-container-${uid}`;


    onMount(() => {

        // grab DOM elements
        const container_el = document.getElementById(container_id);

        // init observers
        const observer_in_view = new IntersectionObserver(async function(entries) {
            // isIntersecting is true when element and viewport are overlapping
            // isIntersecting is false when element and viewport don't overlap

            // if overlap, set as displayed section
            if(entries[0].isIntersecting) visible = true;

        }, { threshold: [0.0] });

        // set target
        observer_in_view.observe(container_el);
    })


</script>

<div id={container_id}>
{#if visible}
    {#if local_url !== null}
        <a target="_blank" href={url} >
            <img src={local_url} alt="tweet preview" draggable="false">
        </a>
    {:else}
        <blockquote 
            class="twitter-tweet" 
            data-cards={cards}
            data-conversation={conversation}
            data-theme={theme}
            data-link-color={linkColor}
            data-width={width}
            data-align={align}
            data-lang={lang}
            data-dnt={dnt}>

            <a href={url}>Tweet from {url}.</a>

        </blockquote> 
    {/if}
{/if}
</div>

<style>

    div {
        max-width: 66%; 
        margin: 1.2rem auto;
        text-align: center;
    }

    img { 
        max-width: 100%;
        border-radius: 12px;
        border-color: rgb(207, 217, 222);
        border-width: 1px;
        border-style: solid;
        overflow: hidden;
        cursor: pointer;
    }

    img:hover {
        filter: brightness(0.96);
    }


    /* on small screen */
    @media only screen and (max-width: 600px) {
        div {
            max-width: 100%; 
        }
    }

</style>
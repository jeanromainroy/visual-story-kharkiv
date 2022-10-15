<script>

    // import libs
    import { onMount } from "svelte";

    // properties
    export let src = '';

    // variables
    const uid = Math.round(Math.random() * 100000.0);
    const container_id = `container-video-${uid}`;
    let visible = false;

    // setup intersection observer
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


<video id={container_id} playsinline autoplay muted loop>
    {#if visible}
        <source type="video/mp4" src={src}/>
    {/if}
</video>

<style>

    video {
        width: 100%;
        height: 100%;
        object-position: center;
        object-fit: cover;
    }

</style>
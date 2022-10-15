<script>
    import { onMount } from "svelte";



    // properties
    export let id = null;
    export let texts = null;
    export let editable = false;
    export let split_text = false;

    // variables
    let text = '';
    let text_left = '';
    let text_right = '';

    // split text in two
    function split_text_in_two(){

        // check if we have a text to display
        if (id === null || texts === null) return;

        // select text
        text = texts[id];

        // verify
        if (text === undefined || text === null || typeof text !== 'string') return;

        // split
        const text_length = text.length;
        const middle = Math.round(text_length / 2.0);
        let index_closest_whitespace = Infinity;

        for (let i=middle-30 ; i<middle+30 ; i++){
            if (text[i] !== ' ') continue;
            if (Math.abs(middle - i) < Math.abs(middle - index_closest_whitespace)) {
                index_closest_whitespace = i;
            }
        }

        // set
        text_left = text.substring(0, index_closest_whitespace);
        text_right = text.substring(index_closest_whitespace, text.length);
    }

    // run
    split_text_in_two();

    // adjust textarea height
    onMount(() => {

        // skip if
        if (!editable) return;

        // get textarea
        const el = document.getElementById(`text-block-${id}`);

        // set height to 1px
        el.style.height = "1px";

        // resize
        setTimeout(function() {
            el.style.height = (el.scrollHeight)+"px";
        }, 1);
    })

</script>


<div class="gallery-text">
    {#if editable}
        <div class="gallery-text-left-right">
            <textarea id={`text-block-${id}`} class="paragraph" placeholder="Write here...">{text}</textarea>
        </div>
    {:else}
        {#if split_text}
            <div class="gallery-text-left">
                <p class="paragraph">{text_left}</p>
            </div>

            <div class="gallery-text-right">
                <p class="paragraph">{text_right}</p>
            </div>
        {:else}
            <div class="gallery-text-left-right">
                <p class="paragraph">{text}</p>
            </div>
        {/if}
    {/if}
</div>


<style>


    textarea {
        font-family: var(--font-ebgaramond);
        font-weight: 100;
        margin: 0px;
        padding: 0px;
        font-size: var(--font-size-normal);
        color: var(--text-black-light);   
        line-height: var(--text-line-height);
        text-align: justify;
        width: 100%;
        /* height: 100%; */
        border: none;
        background-color: white;
        resize: none;
        outline: none;
        display: inline-table;
    }


    .paragraph {
        font-family: var(--font-ebgaramond);
        margin: 0px;
        padding: 0px;
        font-size: var(--font-size-normal);
        color: var(--text-black-light);   
        line-height: var(--text-line-height);
        text-align: justify;
    }

    .gallery-text {
        display: flex;
    }


    .gallery-text-left {
        float: left;
        width: 50%;
        padding-right: 0.7rem;
    }


    .gallery-text-right {
        float: right;
        width: 50%;
        padding-left: 0.7rem;
    }

    
    .gallery-text-left-right {
        width: 100%;
        padding-left: 1rem;
        padding-right: 1rem;
    }


    /* on small screen */
    @media only screen and (max-width: 600px) {
        .gallery-text-left-right {
            padding-left: 0px;
            padding-right: 0px;
        }
    }

</style>
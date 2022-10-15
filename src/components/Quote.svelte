<script>

    // properties
    export let text;
    export let author;

</script>


<div>
    <p class="text">{text}</p>
    {#if author.includes('href')}
        <p class="author embeded-link-dark">{@html author}</p>      
    {:else} 
        <p class="author">- {author}</p>
    {/if}    
</div>


<style>

    div {
        text-align: right;
        margin: 0px;
        padding: 0px;
        margin-top: 1.5rem;
        margin-left: 4.5rem;
    }

    p {
        font-family: var(--font-ebgaramond);
        margin: 0px;
        padding: 0px;
    }

    .text { 
        font-size: var(--font-size-normal-italic);
        font-style: italic;
        color: var(--text-black-light);   
        line-height: var(--text-line-height-large);
        margin-bottom: 8px;
    }

    .author { 
        font-size: var(--font-size-small);
        color: var(--text-black-very-light);   
        line-height: var(--text-line-height);
    }

</style>
<script lang="js">
// @ts-nocheck

  import { writable } from 'svelte/store';

  const GEO_URL = 'https://transactioninfo.ethiotelecom.et/receipt/CEP7I1XF9B';

  const status = writable<'idle'|'loading'|'done'|'error'>('idle');
  const errorMessage = writable<string>('');
  const data = writable<any>(null);

  async function fetchGeo() {
    status.set('loading');
    errorMessage.set('');
    data.set(null);

    try {
      const res = await fetch(GEO_URL);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      const json = await res.json();
      data.set(json);
      status.set('done');
    } catch (err) {
      status.set('error');
      errorMessage.set(err.message);
    }
  }
</script>

<main class="p-4 max-w-lg mx-auto">
  <button
    class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    on:click={fetchGeo}
    disabled={$status === 'loading'}>
    {#if $status === 'idle'}Load Data{/if}
    {#if $status === 'loading'}Loading…{/if}
    {#if $status === 'done'}Reload{/if}
    {#if $status === 'error'}Retry{/if}
  </button>

  {#if $status === 'done'}
    <pre class="mt-4 p-3 bg-gray-100 rounded text-sm overflow-auto">
{JSON.stringify($data, null, 2)}
    </pre>
  {/if}

  {#if $status === 'error'}
    <div class="mt-4 p-3 bg-red-100 text-red-800 rounded">
      ❌ {$errorMessage}
    </div>
  {/if}
</main>

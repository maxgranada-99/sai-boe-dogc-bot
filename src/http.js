export async function fetchText(url, opts = {}) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "sai-alertes-ajuts/1.0 (+github-actions)",
      ...(opts.headers || {})
    },
    ...opts
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} - ${url}`);
  return await res.text();
}

export async function fetchBuffer(url, opts = {}) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "sai-alertes-ajuts/1.0 (+github-actions)",
      ...(opts.headers || {})
    },
    ...opts
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} - ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
  }
  export async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      "user-agent": "sai-bot/1.0",
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${url}`);
  }

  return await res.json();

}
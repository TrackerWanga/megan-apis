export async function shortenUrl(service: string, url: string): Promise<{ shortUrl: string; service: string; original: string }> {
  const svc = service.toLowerCase().trim();

  switch (svc) {
    case "tinyurl": {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("TinyURL service returned an error");
      const shortUrl = await res.text();
      return { shortUrl: shortUrl.trim(), service: "TinyURL", original: url };
    }
    case "isgd": {
      const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("is.gd service returned an error");
      const data = await res.json();
      if (data.errorcode) throw new Error(data.errormessage || "is.gd error");
      return { shortUrl: data.shorturl, service: "is.gd", original: url };
    }
    case "vgd": {
      const res = await fetch(`https://v.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("v.gd service returned an error");
      const data = await res.json();
      if (data.errorcode) throw new Error(data.errormessage || "v.gd error");
      return { shortUrl: data.shorturl, service: "v.gd", original: url };
    }
    case "cleanuri": {
      const res = await fetch("https://cleanuri.com/api/v1/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `url=${encodeURIComponent(url)}`,
      });
      if (!res.ok) throw new Error("CleanURI service returned an error");
      const data = await res.json();
      return { shortUrl: data.result_url, service: "CleanURI", original: url };
    }
    case "chilpit": {
      const res = await fetch(`https://chilp.it/api.php?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("Chilp.it service returned an error");
      const shortUrl = await res.text();
      return { shortUrl: shortUrl.trim(), service: "Chilp.it", original: url };
    }
    case "clckru": {
      const res = await fetch(`https://clck.ru/--?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("clck.ru service returned an error");
      const shortUrl = await res.text();
      return { shortUrl: shortUrl.trim(), service: "clck.ru", original: url };
    }
    case "dagd": {
      const res = await fetch(`https://da.gd/shorten?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("da.gd service returned an error");
      const shortUrl = await res.text();
      return { shortUrl: shortUrl.trim(), service: "da.gd", original: url };
    }
    default:
      throw new Error(`Unknown service: ${service}. Available: tinyurl, isgd, vgd, cleanuri, chilpit, clckru, dagd`);
  }
}

export const shortenerServices = ["tinyurl", "isgd", "vgd", "cleanuri", "chilpit", "clckru", "dagd"];

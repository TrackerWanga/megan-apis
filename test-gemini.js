// Quick test of the Gemini scraper
async function testGemini() {
  // Step 1: Get session tokens from Gemini homepage
  const res = await fetch('https://gemini.google.com/', {
    headers: {'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'}
  });
  const html = await res.text();
  
  const sn = html.match(/"SNlM0e":"(.*?)"/)?.[1] || '';
  const bl = html.match(/"cfb2h":"(.*?)"/)?.[1] || '';
  const sid = html.match(/"FdrFJe":"(.*?)"/)?.[1] || '';
  
  console.log("Tokens found:", { sn: !!sn, bl: !!bl, sid: !!sid });
  
  if (!sn || !bl || !sid) {
    console.log("Could not extract tokens. Gemini may have changed their API.");
    return;
  }
  
  // Step 2: Send a query
  const message = "What is 2+2?";
  const systemPrompt = "You are a helpful assistant. Answer briefly.";
  
  const payload = [null, JSON.stringify([
    [message, 0, null, null, null, null, 0],
    ["id"],
    ["", "", "", null, null, null, null, null, null, ""],
    null, null, null, [1], 1, null, null, 1, 0, null, null, null, null, null, [[0]], 1, null, null, null, null, null,
    ["", "", systemPrompt, null, null, null, null, null, 0, null, 1, null, null, null, []],
    null, null, 1, null, null, null, null, null, null, null, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], 1, null, null, null, null, [1],
  ])];
  
  const query = `bl=${bl}&f.sid=${sid}&hl=en&_reqid=1&rt=c`;
  const apiRes = await fetch(`https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?${query}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
      'x-same-domain': '1'
    },
    body: `f.req=${encodeURIComponent(JSON.stringify(payload))}&at=${sn}`
  });
  
  const text = await apiRes.text();
  const lines = text.split('\n');
  const texts = [];
  
  for (const ln of lines) {
    if (ln.startsWith('[["wrb.fr"')) {
      try {
        const jsonStr = JSON.parse(ln)[0][2];
        const d = JSON.parse(jsonStr);
        if (d[4] && Array.isArray(d[4])) {
          for (const item of d[4]) {
            if (item && Array.isArray(item) && item[1] && Array.isArray(item[1])) {
              const textChunk = item[1][0];
              if (textChunk && typeof textChunk === 'string') {
                texts.push(textChunk);
              }
            }
          }
        }
      } catch (e) {}
    }
  }
  
  if (texts.length > 0) {
    console.log("Response:", texts[texts.length - 1]);
  } else {
    console.log("No response extracted. Raw response (first 500 chars):", text.substring(0, 500));
  }
}

testGemini().catch(console.error);

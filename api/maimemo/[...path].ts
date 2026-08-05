export default async function handler(req: any, res: any) {
  const path = (req.query.path as string[]).join('/');
  const url = `https://open.maimemo.com/open/${path}`;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  const searchParams = new URLSearchParams(req.url.split('?')[1] || '');
  const fullUrl = searchParams.toString() ? `${url}?${searchParams.toString()}` : url;

  const response = await fetch(fullUrl, {
    method,
    headers: {
      'Authorization': req.headers['authorization'] || '',
      'Content-Type': 'application/json',
    },
    body: method !== 'GET' ? req.body : undefined,
  });

  const data = await response.text();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return res.status(response.status).send(data);
}

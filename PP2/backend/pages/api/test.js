import { json } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const body = await json(req);
      console.log("Parsed body in test route:", body);
      res.status(200).json({ message: "Test route works", body });
    } catch (error) {
      console.error("Error parsing body in test route:", error);
      res.status(500).json({ error: 'Unable to parse JSON body' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

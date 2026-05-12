module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bal, apr, pay, baseMonths, baseInterest, bestDur, bestMonthly, bestFees, saves } = req.body;

  const prompt = `You are a warm American Express financial advisor helping a cardmember understand their lending options. Here is their situation:

Balance: $${bal}
APR: ${apr}%
Monthly payment: $${pay}
Payoff timeline carrying interest: ${baseMonths ? baseMonths : 'never - payment is too low'}
Total interest if they carry the balance: ${baseInterest !== null ? '$' + baseInterest : 'continuously growing'}
Best Plan It option (automatically calculated based on their payment rate): ${bestDur} months at $${bestMonthly}/month, total fees $${bestFees}
${saves !== null && saves > 0 ? 'Plan It would save them: $' + saves + ' compared to carrying interest' : ''}

Write a 3-sentence personalized recommendation. Be specific with dollar figures. Tell them clearly which option is better for their situation and exactly why. Sound like a trusted advisor - warm and direct, not robotic. Do not use bullet points or headers.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || 'Unable to generate advice right now.';
    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate recommendation' });
  }
};

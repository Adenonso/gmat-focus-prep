import { NextResponse } from 'next/server'

type GenerateBody = {
  mode?: string
  section?: string
  topic?: string
  difficulty?: string
  [key: string]: any
}

export async function POST(req: Request) {
  try {
    const body: GenerateBody = await req.json()
    const apiKey = process.env.ANTHROPIC_API_KEY || ""

    // Check if the API key is missing or set to placeholder
    const isMockMode = !apiKey || apiKey === "your_anthropic_api_key_here"

    if (body.mode === 'generateQuestion') {
      if (isMockMode) {
        // High-fidelity fallback GMAT Focus questions
        const mockQuestions: Record<string, Array<{ question: string; choices: Record<string, string>; correct: string; explanation: string; wrongAnswerBreakdown: Record<string, string> }>> = {
          Quantitative: [
            {
              question: "If x is a positive integer, is x divisible by 6?\n\n(1) x is divisible by 3\n(2) x is divisible by 2",
              choices: {
                A: "Statement (1) ALONE is sufficient, but statement (2) alone is not sufficient.",
                B: "Statement (2) ALONE is sufficient, but statement (1) alone is not sufficient.",
                C: "BOTH statements TOGETHER are sufficient, but NEITHER statement ALONE is sufficient.",
                D: "EACH statement ALONE is sufficient.",
                E: "Statements (1) and (2) TOGETHER are NOT sufficient."
              },
              correct: "C",
              explanation: "To be divisible by 6, x must be divisible by both 2 and 3. Statement (1) only ensures divisibility by 3 (e.g. x=9 is not divisible by 6). Statement (2) only ensures divisibility by 2 (e.g. x=4 is not divisible by 6). Combining both ensures x is divisible by 6. Thus, both statements together are sufficient.",
              wrongAnswerBreakdown: {
                A: "Incorrect. Divisibility by 3 alone is insufficient.",
                B: "Incorrect. Divisibility by 2 alone is insufficient.",
                D: "Incorrect. Neither statement alone is sufficient.",
                E: "Incorrect. Combining both factors of 2 and 3 guarantees divisibility by 6."
              }
            }
          ],
          Verbal: [
            {
              question: "A study shows that cities with more parks have lower obesity rates. The author concludes that building parks causes citizens to lose weight. Which option points out the logical flaw?",
              choices: {
                A: "Citizens in those cities might also buy more exercise equipment.",
                B: "It fails to state how many citizens visit the parks daily.",
                C: "It ignores the possibility that healthier, wealthier citizens are more likely to migrate to cities that already have parks, meaning parks do not directly cause the weight loss.",
                D: "It assumes that citizens only exercise in public parks.",
                E: "Other cities have built parks but obesity rates remained unchanged."
              },
              correct: "C",
              explanation: "This highlights a correlation-causation fallacy. Wealthier, healthier citizens migrating to green cities represents an alternative cause.",
              wrongAnswerBreakdown: {
                A: "Incorrect. Focuses on a minor alternative rather than the central logical loop.",
                B: "Incorrect. Fails to weaken the causal claim itself.",
                D: "Incorrect. Out of scope.",
                E: "Incorrect. Focuses on other cities instead of addressing the internal logic flaw."
              }
            }
          ],
          "Data Insights": [
            {
              question: "Year | Product A Sales | Product B Sales\n2021 | 120 units | 80 units\n2022 | 140 units | 95 units\n2023 | 110 units | 130 units\n\nWhich product had the highest percentage increase in sales from 2021 to 2023?",
              choices: {
                A: "Product A, with an increase of 30%",
                B: "Product B, with an increase of 62.5%",
                C: "Product B, with an increase of 50%",
                D: "Product A, with an increase of 10%",
                E: "Both products experienced equal growth."
              },
              correct: "B",
              explanation: "Product A sales decreased. Product B went from 80 to 130 (increase of 50). Percentage increase = (50 / 80) * 100% = 62.5%.",
              wrongAnswerBreakdown: {
                A: "Incorrect. Product A decreased overall.",
                C: "Incorrect. Arithmetic slip using 50/100 instead of 50/80.",
                D: "Incorrect. Product A did not grow.",
                E: "Incorrect. Growth rates are vastly different."
              }
            }
          ]
        }
        const { section = 'Quantitative' } = body
        const list = mockQuestions[section] || mockQuestions.Quantitative
        const randomQ = list[Math.floor(Math.random() * list.length)]
        return NextResponse.json({ ok: true, data: randomQ })
      }

      const { section = 'Quantitative', topic = 'General', difficulty = 'Medium' } = body
      const systemPrompt = `You are a GMAT Focus Edition expert. Generate a ${difficulty} ${section} question on the topic of ${topic}. Return ONLY a JSON object with this structure: { question: string, choices: { A: string, B: string, C: string, D: string, E: string }, correct: string, explanation: string, wrongAnswerBreakdown: { A: string, B: string, C: string, D: string, E: string } }. No preamble, no markdown.`

      const payload = {
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: systemPrompt }],
        max_tokens: 1200
      }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || `Anthropic API error: ${res.status}`)
      }

      const text = data?.content?.[0]?.text || ''

      // Attempt to parse JSON out of Claude's response
      let parsed: any = null
      try {
        parsed = JSON.parse(text.trim())
      } catch (e) {
        // try to extract JSON substring
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start !== -1 && end !== -1) {
          try {
            parsed = JSON.parse(text.slice(start, end + 1))
          } catch (e2) {
            parsed = { raw: text }
          }
        } else {
          parsed = { raw: text }
        }
      }

      return NextResponse.json({ ok: true, data: parsed })
    }

    if (body.mode === 'analyzeMock') {
      if (isMockMode) {
        return NextResponse.json({
          ok: true,
          data: {
            summary: "Excellent completion! High accuracy in Quantitative logic but minor pacing adjustments are suggested for multi-source reasoning under timed conditions.",
            improvementPlan: "1. Complete 10 algebraic DS questions in under 2 minutes each.\n2. Work on Critical Reasoning correlation weaken patterns.\n3. Increase reading comprehension speed using targeted lessons.",
            bySection: {
              Quantitative: "Good accuracy (70%+). Ready for hard Algebra drills.",
              Verbal: "Pacing was stable. Focus on logical fallacies.",
              DataInsights: "Increase speed on table graphs."
            }
          }
        })
      }

      const session = body.session || {}
      const prompt = `You are a GMAT Focus Edition expert. Analyze the student's mock exam results provided as JSON: ${JSON.stringify(session)}. Return ONLY a JSON object with this structure: { summary: string, improvementPlan: string, bySection: { [section: string]: string } }. Keep suggestions actionable and include 3-5 concrete study tasks. No preamble, no markdown.`

      const payload = {
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200
      }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || `Anthropic API error: ${res.status}`)
      }

      const text = data?.content?.[0]?.text || ''

      let parsed: any = null
      try {
        parsed = JSON.parse(text.trim())
      } catch (e) {
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start !== -1 && end !== -1) {
          try { parsed = JSON.parse(text.slice(start, end + 1)) } catch { parsed = { raw: text } }
        } else {
          parsed = { raw: text }
        }
      }

      return NextResponse.json({ ok: true, data: parsed })
    }

    if (body.mode === 'chat') {
      const messages = body.messages || []
      
      if (isMockMode) {
        const userMsg = messages[messages.length - 1]?.content || ""
        return NextResponse.json({
          ok: true,
          data: {
            reply: `I am currently running in Offline Prototyping Mode (no Anthropic Key set).\n\nRegarding your query "${userMsg}": For the GMAT Focus, remember that Data Sufficiency tests if the information is sufficient to solve, NOT the numeric answer itself. Ask me to drill you on specific topics or explain DS rules!`
          }
        })
      }

      const payload = {
        model: 'claude-3-5-sonnet-20241022',
        messages: messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        max_tokens: 1000
      }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || `Anthropic API error: ${res.status}`)
      }

      const text = data?.content?.[0]?.text || ''
      return NextResponse.json({ ok: true, data: { reply: text } })
    }

    return NextResponse.json({ ok: false, error: "Invalid action specified." }, { status: 400 })
  } catch (err: any) {
    console.error("API error in route:", err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}


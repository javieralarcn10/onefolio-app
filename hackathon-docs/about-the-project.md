## Inspiration

Besides being a developer, I’m also a small stock investor. I don’t have a huge portfolio, no crypto, no physical assets, bonds, or ETFs. Still, I’ve always cared about knowing exactly where my money is and making better decisions.

We often think that owning 20 stocks means we’re diversified. But what if those 20 stocks are all from the same country and the same sector? The risk is still concentrated.

It’s great to know what you own and how much you own. Not knowing where you’re exposed is dangerous.

## What it does

Onefolio breaks down all your assets.

You don’t just see “Bitcoin” or “S&P 500.” You see your real exposure, clearly and intuitively: currencies, countries, and sectors.

In my opinion, this is exactly what the VisualPolitik EN audience is looking for. Many of their videos focus on geopolitics, tensions between countries, wars, and global shifts. Understanding your global exposure makes more sense than simply having all your assets displayed in a single app.

## How we built it

Even though in a hackathon speed is the number one priority, which is easy to achieve with tools like Claude or Gemini, I like to focus heavily on product design and how users will interact with it.

My goal is always to make things as simple as possible through a clean, intuitive, and professional interface.

To move fast, I built everything with Expo and NativeWind for rapid UI development. I used RevenueCat for subscriptions, React Query on the frontend, and Next.js caching on the backend to keep queries fast and efficient.

Performance is also a top priority for me. If something feels slow in a world where no one wants to wait, users will leave.

Beyond the UI, I built a scoring engine to quantify portfolio diversification using a normalized version of the Herfindahl-Hirschman Index (HHI), a standard measure of concentration.

For a portfolio with $N$ assets, where $p_i$ represents the percentage weight of asset $i$ and $\sum p_i = 100$, the concentration is calculated as:

$$
HHI = \sum_{i=1}^{N} (p_i)^2
$$

Since HHI ranges from $1/N$ (perfect diversification) to $1$ (full concentration), I normalize it:

$$
HHI_{norm} = \frac{HHI_{max} - HHI}{HHI_{max} - HHI_{min}}
$$

Where:

- $HHI_{max} = 1$
- $HHI_{min} = 1/N$

Finally, I convert it into a user-friendly 0–100 diversification score with a bounded scale:

$$
Score = \max(5, \min(95, HHI_{norm} \times 85 + 10))
$$

This scoring system is applied recursively across three independent dimensions:

- **Geographic exposure** (country of domicile or revenue origin)
- **Currency exposure** (underlying fiat risk)
- **Sector exposure** (industry classification)

This allows us to abstract complex financial concentration risk into a single intuitive health indicator.


## Challenges we ran into

The biggest challenge was figuring out how to present the complexity and diversity of financial data in the simplest possible way.

USD, EUR, crypto, bonds, ETFs, etc. Mixing apples and oranges is never easy.

I had to do significant backend work using the open source Yahoo Finance API so the frontend receives data that is clean and well structured. That way, complex calculations and tedious processes are handled behind the scenes.

Here’s a small example of how I calculate portfolio health:

## Accomplishments that we're proud of

I believe one of the key differentiators of this app is that I did not use AI for the design.

In a world where everyone relies on AI for UI generation, many apps start to look generic and repetitive. When users are managing meaningful amounts of money, trust matters.

By using Mobbin and other curated sources of inspiration, I’ve created an interface that looks clean, feels professional, and is easy to understand.

## What we learned

From a technical perspective, development was not an obstacle for me.

The real lesson was learning to say no to feature ideas. It’s tempting to keep adding functionality, but filling an app with features only makes it usable by experts.

Abstracting the complexity of the financial world into an interface that feels obvious and simple has been the hardest part.

## What's next for Onefolio: Global Exposure

Next, I want to add real AI analysis that reacts to news, tweets, and global events, warning users about potential risks in real time.

I would also like to integrate directly with banks and investment platforms so users don’t have to enter data manually.

Finally, I plan to add a section called “The Global Consensus,” where users can anonymously compare their risk structure with the community average or with successful investors.

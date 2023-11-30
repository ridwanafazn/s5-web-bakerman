// this file is in the 'src/pages/Mission.jsx'
import React from 'react';
import '../styles/mission.css'

const Mission = () => {
    return (
        <body>
            <article className="mission-container"> {/* Mengganti div menjadi article karena ini adalah bagian dari konten */}
            {/* Hero Section */}
            <section className="hero-section"> {/* Mengganti div menjadi section karena ini adalah bagian dari konten */}
                <h1>Our Sweet Mission.</h1>
                <p>
                    At Bakerman, we&apos;re on a mission to redefine your sweet experience. Join us in embracing
                    a healthier lifestyle while savoring the goodness of our bakery treats.
                </p>
            </section>

            {/* Sugar Reduction Challenge */}
            <section className="challenge-section"> {/* Mengganti div menjadi section karena ini adalah bagian dari konten */}
                <h2>Sweet Choices, Smart Limits.</h2>
                <p>
                    We care about your well-being. Every week, you have up to 3 chances to indulge in our
                    sweet delights, each calculated to contain a maximum of 40g of sugar. It&apos;s a delicious
                    journey with mindful choices.
                </p>
            </section>

            {/* Fitness Integration */}
            <section className="fitness-section"> {/* Mengganti div menjadi section karena ini adalah bagian dari konten */}
                <h2>Earn Sweet Treats with Every Stride.</h2>
                <p>
                    We believe in balance. Connect your Strava account and exchange your sports activities
                    for chances to treat yourself. For each validated Strava activity, you earn an additional
                    chance to enjoy our treats guilt-free.
                </p>
            </section>

            {/* How It Works */}
            <section className="how-it-works-section"> {/* Mengganti div menjadi section karena ini adalah bagian dari konten */}
                <h2>Navigating Your Bakerman Mission.</h2>
                <ul>
                    <li>1. Purchase Chances: Explore our bakery wonders, but with a limit. You have three chances to buy treats each week.</li>
                    <li>2. Sugar Cap: Each chance is designed to provide you with a sweet experience without exceeding 40g of sugar.</li>
                    <li>3. Strava Exchange: Integrate your Strava account. Engage in sports activities, and for each valid session, earn an extra chance to treat yourself.</li>
                </ul>
            </section>

            {/* Empowering Choices */}
            <section className="empowering-section"> {/* Mengganti div menjadi section karena ini adalah bagian dari konten */}
                <h2>More Than a Bakery.</h2>
                <p>
                    Bakerman is not just about pastries; it&apos;s a lifestyle. We encourage you to savor the sweetness
                    in moderation, embrace physical activity, and make choices that empower your well-being.
                </p>
            </section>

            {/* Join the Movement */}
            <section className="movement-section"> {/* Mengganti div menjadi section karena ini adalah bagian dari konten */}
                <h2>Become a Bakerman Advocate.</h2>
                <p>
                    Spread the sweetness responsibly. Share your Bakerman journey on social media using #BakermanBalance
                    and inspire others to make mindful choices. Let&apos;s create a community that celebrates the joy of living well.
                </p>
            </section>
        </article>
        {/* <aside>
            <h2 className='aside-title'>News Update</h2>
            <div className="slideshow-container">
                <div className="mySlides fade">
                    <img src="" alt="Slide 1"/>
                    <p>Patch 4.0.1 New Agent Iso : Chinese Fighter</p>
                </div>
                <a className="prev" onclick="plusSlides(-1)">&#10094;</a>
                <a className="next" onclick="plusSlides(1)">&#10095;</a>
            </div>
        </aside> */}
        
        </body>
        
    );
};

export default Mission;

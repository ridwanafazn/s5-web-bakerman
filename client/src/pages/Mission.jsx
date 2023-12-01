// this file is in the 'src/pages/Mission.jsx'
import React, { useState, useEffect } from 'react';
import '../styles/mission.css'
import tspsugar from '../assets/images/article-mission/too-much-sugar.webp'





const Mission = () => {
    //pengen slideshow 
    // const [slideIndex, setSlideIndex] = useState(1);

    // const plusSlides = (n) => {
    //     setSlideIndex((prevIndex) => prevIndex + n);
    // };

    // const showSlide = (n) => {
    //     const slides = document.getElementsByClassName('article-advertise');
    //     if (n > slides.length) {
    //         setSlideIndex(1);
    //     } else if (n < 1) {
    //         setSlideIndex(slides.length);
    //     } else {
    //         setSlideIndex(n);
    //     }
    // };

    // useEffect(() => {
    //     showSlide(slideIndex);
    // }, [slideIndex]);

    const showSlide = (n) => {
        const slides = document.getElementsByClassName('article-advertise');
        const info = document.querySelector('.aside-info');
    
        if (n > slides.length) {
            setSlideIndex(1);
        } else if (n < 1) {
            setSlideIndex(slides.length);
        } else {
            setSlideIndex(n);
        }
    
        // Mengatur transformasi berdasarkan indeks slide
        info.style.transform = `translateX(${-100 * (slideIndex - 1)}%)`;
    };
    

    return (
        <div className='mission-container'>
            <div className='left-mission'>
                <article className="mission-article"> {/* Mengganti div menjadi article karena ini adalah bagian dari konten */}
                    {/* Hero Section */}
                    <section className="hero-section"> {/* Mengganti div menjadi section karena ini adalah bagian dari konten */}
                        <h1>Our Sweet Mission </h1>
                        <p>
                            At Bakerman, we&apos;re on a mission to redefine your sweet experience. Join us in embracing
                            a healthier lifestyle while savoring the goodness of our bakery treats. <br />
                        </p>
                        <img className='assets' src={tspsugar} alt="Too much sugar" />
                        <p>There are many speculations regarding the root cause of diabetes, one of them being an excessive consumption of sugar. Diabetes is a complex medical condition caused by a combination of factors. Eating too much sugar alone isn’t enough to cause diabetes; it’s much more complicated than that. For example, type 2 diabetes, which accounts for 90% to 95% of all diagnosed diabetes, per the Centers for Disease Control and Prevention, can develop due to a combination of genetic and lifestyle factors. While the American Diabetes Association notes that there is an association between increased intake of sugary beverages and type 2 diabetes, eating sugar doesn’t cause diabetes. Causation and association aren’t the same as correlation. Other factors, such as environment, genetics, medical history, age, race, physical activity and stress, also play a role.
                            Read on to learn more about the complexities of diabetes, the different types, the best ways to eat to reduce your risk and more.</p>

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
                        <p>
                            <ol>
                                <li><p>Purchase Chances: Explore our bakery wonders, but with a limit. You have three chances to buy treats each week.</p></li>
                                <li><p>Sugar Cap: Each chance is designed to provide you with a sweet experience without exceeding 40g of sugar.</p></li>
                                <li><p>Strava Exchange: Integrate your Strava account. Engage in sports activities, and for each valid session, earn an extra chance to treat yourself.</p></li>
                            </ol>
                        </p>

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

            </div>
            <div className='right-mission'>
                <aside>
                    <h1>Other Eating Well Article</h1>
                    <div className="aside-info">
                        <div className="article-advertise slide1">
                            <img className='assets' src={tspsugar} alt="slide1"/>
                            <p>What Happens to Your Body When You Have Insulin Resistance</p>
                        </div>
                        <div className="article-advertise slide2">
                            <img className='assets' src={tspsugar} alt="slide2" />
                            <p>7-Day No-Sugar High-Fiber Meal Plan for Insulin Resistance</p>
                        </div>
                        <div className="article-advertise slide3">
                            <img className='assets' src={tspsugar} alt="slide3" />
                            <p>Gluten free? Gotta be Nature&apos;s Bakery.</p>
                        </div>
                    </div>
                    <button className="prev" onClick={() => plusSlides(-1)}>&#10094;</button>
                    <button className="next" onClick={() => plusSlides(1)}>&#10095;</button>
                </aside>
            </div>

        </div>


    );
};

export default Mission;

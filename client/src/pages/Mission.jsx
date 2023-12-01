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

    // const showSlide = (n) => {
    //     const slides = document.getElementsByClassName('article-advertise');
    //     const info = document.querySelector('.aside-info');

    //     if (n > slides.length) {
    //         setSlideIndex(1);
    //     } else if (n < 1) {
    //         setSlideIndex(slides.length);
    //     } else {
    //         setSlideIndex(n);
    //     }

    //     // Mengatur transformasi berdasarkan indeks slide
    //     info.style.transform = `translateX(${-100 * (slideIndex - 1)}%)`;
    // };

    const [slideIndex, setSlideIndex] = useState(1);

    const plusSlides = (n) => {
        setSlideIndex((prevIndex) => prevIndex + n);
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
                            We are deeply committed to prioritizing your well-being and fostering a holistic approach to a healthier lifestyle. Each week, we extend to you the opportunity to indulge in our delectable sweet delights, carefully crafted with a conscientious touch. These tempting treats are meticulously calculated to ensure they contain no more than 40g of sugar, allowing you the freedom to savor the goodness without compromising your health. Embark on a delightful journey with us, where every choice is made mindfully, enriching your experience with the perfect blend of flavor and well-being.
                        </p>
                    </section>

                    {/* Fitness Integration */}
                    <section className="fitness-section"> {/* Mengganti div menjadi section karena ini adalah bagian dari konten */}
                        <h2>Earn Sweet Treats with Every Stride.</h2>
                        <p>
                        At the heart of our philosophy lies a steadfast belief in the harmonious balance between a fulfilling lifestyle and your well-being. Embrace a holistic approach to health by seamlessly integrating your Strava account into our community. This innovative connection not only adds a dynamic dimension to your fitness journey but also opens the door to a realm of delectable rewards.
                        </p>
                        <p>
                        When you choose to synchronize your Strava activities with us, every stride, every endeavor, transforms into an opportunity to pamper yourself guilt-free. It's not just about exercise; it's about celebrating each milestone, each achievement, with the sweetness that complements your active lifestyle. For every validated Strava activity, we happily offer you an additional chance to indulge in our treats, creating a perfect synergy between your fitness accomplishments and the joy of savoring our delightful creations. Join us in this unique experience where your dedication to a healthy, active life is not just acknowledged but celebrated with every tantalizing bite.
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
                        <div className="article-advertise">
                            <img className='assets' src={tspsugar} alt="slide1" />
                            <p>What Happens to Your Body When You Have Insulin Resistance</p>
                        </div>
                        <div className="article-advertise">
                            <img className='assets' src={tspsugar} alt="slide2" />
                            <p>7-Day No-Sugar High-Fiber Meal Plan for Insulin Resistance</p>
                        </div>
                        <div className="article-advertise">
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

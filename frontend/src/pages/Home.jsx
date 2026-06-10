import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import DonationCard from '../components/DonationCard'
import Footer from '../components/Footer'
import React from 'react'

function Home() {
  return (
    <>
      <Navbar />

      <Hero />

      <section className="categories">
        <div className="container">
          <h2 className="section-title">
            Donation Categories
          </h2>

          <div className="cards">
            <DonationCard
              icon="💰"
              title="Funds"
              description="Support people financially through secure donations."
            />

            <DonationCard
              icon="🍲"
              title="Food"
              description="Provide meals and food supplies to families in need."
            />

            <DonationCard
              icon="👕"
              title="Clothes"
              description="Donate clothing for children and adults."
            />

            <DonationCard
              icon="📚"
              title="Books"
              description="Help students by donating educational materials."
            />

            <DonationCard
              icon="🏥"
              title="Medical Supplies"
              description="Support healthcare needs through medical donations."
            />
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

export default Home
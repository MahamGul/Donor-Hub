import React from 'react'

import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import HowItWorks from '../components/Howitworks'
import DonationCard from '../components/DonationCard'
import CTABand from '../components/CTABand'
import Footer from '../components/Footer'

import './Home.css'

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <HowItWorks />
      <DonationCard />
      <CTABand />
      <Footer />
    </>
  )
}

export default Home
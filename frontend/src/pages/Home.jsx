import React from 'react'

import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import HandsAnimation from '../components/HandsAnimations'  // ← add this
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
      <HandsAnimation />   {/* ← add this */}
      <HowItWorks />
      <DonationCard />
      <CTABand />
      <Footer />
    </>
  )
}

export default Home
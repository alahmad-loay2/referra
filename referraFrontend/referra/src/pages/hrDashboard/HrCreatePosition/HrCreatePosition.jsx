import React from 'react'
import "./HrCreatePosition.css"
import Button from '../../../components/button/Button'
import { Link } from 'react-router-dom'

const HrCreatePosition = () => {
  return (
    <div className='HrCreatePosition'>
        <div className='CreatePositionContainer'>
        <Link to="/dashboard/hr/positions">&lt;-</Link>
        <h3>Create New Positions</h3>
        <p>Add a new job opening for your department</p>
        <form className='formContainer'>
        <div className="formGroup">
          <label htmlFor="positionTitle">Job Title*</label>
          <input type="text" placeholder="e.g. Software Engineer" required />
        </div>
        <div className="formGroup">
          <label htmlFor="yearsOfExperience">Years Of Experience Needed*</label>
          <input type="text" placeholder="e.g. 2 years" required />
          <label htmlFor="location">Location*</label>
            <input type="text" placeholder="e.g. USA" required />
        </div>
        <div className="formGroup">
          <label htmlFor="CompanyName">Company Name*</label>
          <input type="text" placeholder="e.g. Aspire" required />
        </div>
        <div className="formGroup">
          <label htmlFor="department">Department*</label>
          <input type="text" placeholder="e.g. IT" required />
        </div>
        <div className="formGroup">
          <label htmlFor="TimeZone">Time Zone for Position*</label>
          <input type="text" placeholder="e.g. UST" required />
        </div>
        <div className="formGroup">
          <label htmlFor="Deadline">Deadline for Position*</label>
          <input type="text" placeholder="e.g. 15/3/2027" required />
        </div>
        <div className="formGroup">
          <label htmlFor="Description">Description*</label>
          <textarea placeholder="e.g. Techstack needed + work environment" required />
        </div>
        <div className='buttonGroup'>
        <button className='cancel'>cancel</button>
        <button className='create' type="submit">Create Position</button>
        </div>
        </form>
        </div>
    </div>
  )
}

export default HrCreatePosition
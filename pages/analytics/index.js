import TopSection from '@/src/component/analytics/TopSection'
import Search from '@/src/component/analytics/Search'
import React from 'react'
import ProfileMatches from '@/src/component/analytics/ProfileMatch'
import ReportsThisWeek from '@/src/component/analytics/ReportThisWeek'

const index = () => {
  return (
 
<>
    {/* <Search/> */}
    <Search/>
    <TopSection/> 
    <ProfileMatches/>
    <ReportsThisWeek/>
    
</>
    
  )
}

export default index
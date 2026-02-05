import React, { useState } from 'react'
import Search from '@/src/component/varificationrequest/Search'
import VarificationRequest from '@/src/component/varificationrequest/VarificationRequest'

const index = () => {
  const [searchText, setSearchText] = useState("");

  return (
    <>
      <Search onSearch={(value) => setSearchText(value)} />

      <div className="pt-[90px]">
        <VarificationRequest search={searchText} />
      </div>
    </>
  )
}

export default index

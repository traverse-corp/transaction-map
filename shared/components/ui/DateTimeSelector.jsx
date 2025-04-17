import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DemoContainer } from '@mui/x-date-pickers/internals/demo'
import React from 'react'
import { TRANSACTION_DATE_FORMAT } from '@assets/Constant.js'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import dayjs from 'dayjs'
import { useSearchStore } from '@features/transactionMap/stores/useSearchStore.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export const DateTimeSelector = ({ timeValue, setTimeValue, Icon, label, width = 270 }) => {
  const timeZone = useSearchStore((state) => state.timeZone || 'UTC')

  return (
    <div style={{ width: width }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DemoContainer
          components={['DateTimePicker']}
          sx={{
            width: width
          }}
        >
          <DateTimePicker
            slots={{
              openPickerIcon: Icon
            }}
            slotProps={{
              inputAdornment: {
                position: 'start'
              }
            }}
            ampm={false}
            label={label}
            format={TRANSACTION_DATE_FORMAT}
            value={
              timeValue ? dayjs.unix(timeValue).tz(timeZone === 'KST' ? 'Asia/Seoul' : 'UTC') : null
            }
            onChange={(newValue) => {
              if (!newValue) return
              const timestamp = dayjs(newValue)
                .tz(timeZone === 'KST' ? 'Asia/Seoul' : 'UTC')
                .unix()
              setTimeValue(timestamp)
            }}
          />
        </DemoContainer>
      </LocalizationProvider>
    </div>
  )
}

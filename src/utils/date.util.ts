import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
require('dayjs/locale/pt-br');
require('dayjs/plugin/timezone');

export const setDateTOSP = (date: Date): Date => {
  dayjs.extend(utc);
  dayjs.extend(tz);
  dayjs.tz.setDefault('America/Sao_Paulo');
  dayjs.locale('pt-br');

  console.log('formatted date', dayjs(date).toDate());

  return dayjs(date).utc().local().toDate();
};

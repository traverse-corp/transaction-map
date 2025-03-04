/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios';
import { Component } from 'react';
import createAxiosInterceptor from './AxiosInterceptor';
import ComUtil from './ComUtil';

const API_BASE_URL = '/ts/dash/';
const API_GRPAH_BASE_URL = '/ts/v2/graph/';

const axiosInstance = createAxiosInterceptor();

/**
 * Binary 이미지 파일 다운로드
 */
class ApiService extends Component {
  async downloadImage(svc, props) {
    return await axiosInstance({
      url: API_BASE_URL + svc,
      method: 'post',
      responseType: 'blob',
      data: props,
    }); //비동기 함수
  }

  /**
   * 로그인 전용 서비스
   * @param {*} svc
   * @param {*} props
   * @returns
   */
  async sendLogin(svc, props) {
    return await axios({
      url: API_BASE_URL + svc,
      method: 'post',
      data: props,
    }); //비동기 함수
  }
  /**
   * 파일 다운로드
   * @param {*} svc
   * @param {*} props
   * @returns
   */
  async fileDown(svc, props) {
    return await axiosInstance({
      url: API_BASE_URL + svc,
      method: 'post',
      data: props,
      responseType: 'blob', //arraybuffer
    }).then(function a(response) {
      if (response && response.data) {
        let blob = new Blob([response.data], {
          type: response.headers['content-type'],
        });

        let disposition = response.headers['content-disposition'];
        if (disposition && disposition.indexOf('filename') > -1) {
          let name = decodeURI(disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1].replace(/['"]/g, ''));
          if (window.navigator.msSaveOrOpenBlob) {
            // IE 10+는 해당 함수 제공
            window.navigator.msSaveOrOpenBlob(blob, name);
          } else {
            let link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.target = '_self';
            if (name) link.download = name;
            link.click();
            window.URL.revokeObjectURL(link); //메모리 누수 방지
          }
        } else {
          ComUtil.showPopUp('요청 파일이 없습니다.');
        }
      }
    }); //비동기 함수
  }
  /**
   * API POST 통신
   * @param {} svc 호출 서비스ID
   * @param {*} props 전송 데이터
   */
  async sendPost(svc, props) {
    return await axiosInstance({
      url: API_BASE_URL + svc,
      method: 'post',
      data: props,
    }); //비동기 함수
  }

  /**
   * API POST 파일 업로드 통신(multipart/form-data)
   * @param {} svc 호출 서비스ID
   * @param {*} props 전송 데이터
   */
  async sendUpload(svc, props) {
    return await axiosInstance({
      url: API_BASE_URL + svc,
      method: 'post',
      data: props,
      headers: { 'Content-Type': 'multipart/form-data' },
      processData: false,
    }); //비동기 함수
  }

  /**
   * API GET 통신
   * @param {} svc 호출 서비스ID
   * @param {*} props 전송 데이터
   */
  async sendGet(svc, props) {
    return await axiosInstance({
      url: API_BASE_URL + svc,
      method: 'get',
      data: props,
    });
  }

  /**
   * 그래프 서버 API POST 통신
   * @param {} svc 호출 서비스ID
   * @param {*} props 전송 데이터
   */
  async sendPostToGraph(svc, props) {
    return await axiosInstance({
      url: API_GRPAH_BASE_URL + svc,
      method: 'post',
      data: props,
    }); //비동기 함수
  }
  /**
   * 그래프 서버 API GET 통신
   * @param {} svc 호출 서비스ID
   * @param {*} props 전송 데이터
   */
  async sendGetToGraph(svc, props) {
    return await axiosInstance({
      url: API_GRPAH_BASE_URL + svc,
      method: 'get',
      data: props,
    });
  }
}

export default new ApiService();

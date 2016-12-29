import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { FileUploader } from 'ng2-file-upload/file-upload/file-uploader.class';
export interface FILE_UPLOAD_RESPONSE {
  success: boolean;
  item: any;
  response: any;
  status: any;
  headers: any;
};

export interface FILE_UPLOAD_OPTIONS {
    folder: string;
};


export interface FILE_UPLOADED {
    error?: string;
    url: string;
    filename?: string;
};



@Injectable()
export class FileServer {
    
    //serverUrl: string = "http://work.org/file-server/index.php";
    serverUrl: string = "https://file.withcenter.com/index.php";
    private uploader: FileUploader = Object();
    private result:FILE_UPLOAD_RESPONSE = <FILE_UPLOAD_RESPONSE> {};

    constructor(
        private http: Http
    ) {
        console.log("FileServer::constructor()");
    }
    getUploadUrl( options: FILE_UPLOAD_OPTIONS ) {
        return this.serverUrl + '?' + 'folder=' + options.folder;
    }
    getDeleteUrl( file: FILE_UPLOADED ) {
        return this.serverUrl + '?action=delete&url=' + encodeURIComponent( file.url );
    }
    getListUrl( folder: string ) {
        return this.serverUrl + '?action=list&folder=' + encodeURIComponent( folder );
    }


    /**
     * 
     * 
     * @return void
     *      - If no file selected, it pass 2 through completeCallback().
     *      - If file upload success, it pass 0 through completeCallback().
     *      - If there was error, it pass 1 through completeCallback().
     * 
     */
    upload( options: FILE_UPLOAD_OPTIONS,
        successCallback: (uploaded: FILE_UPLOADED ) => void,
        failureCallback: ( error: string ) => void,
        completeCallback?: ( code: number ) => void,
        progressCallback?: ( percentage: number ) => void ) {

        let url = this.getUploadUrl( options );
        console.log("Data::upload options and event, url ", options, event, url);
        this.uploader = new FileUploader({ url: url });

        try {
            if ( event === void 0 || event.target === void 0 || event.target['files'] === void 0 || event.target['files'][0] == void 0 ) {
                if ( completeCallback ) completeCallback( 2 );
                return;
            }
            this.initFileUpload( successCallback, failureCallback, completeCallback, progressCallback );
            this.uploader.addToQueue( event.target['files'] );
        }
        catch ( e ) {
            failureCallback( "Error caught in FileServer::upload()" );
        }
    }
    initFileUpload(
        successCallback: (data: FILE_UPLOADED ) => void,
        failureCallback: (error:string) => void,
        completeCallback?: ( code: number ) => void,
        progressCallback?: (progress:number) => void
    ) {
        console.log('initFileUpload()');

        this.uploader.onSuccessItem = (item, response, status, headers) => {
            console.log('onSuccessItem()');
            this.result = {
                "success": true,
                "item": item,
                "response": response,
                "status": status,
                "headers": headers
            };
            console.log( 'onSuccessItem : ', this.result );
        };
        this.uploader.onErrorItem = (item, response, status, headers) => {
            console.log('onFailureItem()');
            this.result = {
                "success": false,
                "item": item,
                "response": response,
                "status": status,
                "headers": headers
            };
            console.log( 'onErrorItem : ', this.result );
        };
        this.uploader.onProgressItem = ( item, progress ) => {
            try {
                // console.info(progress);
                let p = parseInt( progress );
                let per = Math.round( p );
                if ( progressCallback ) progressCallback( per );
                console.log("onProgressItem: ", per );
            }
            catch ( e ) {
                console.error( progress );
            }
        };
        this.uploader.onCompleteAll = () => {
            console.log("uploader.onCompleteAll()");
            // this.onBrowserUploadComplete();
            let re: FILE_UPLOADED = null;
            try {
                re = JSON.parse( this.result['response'] );
            }
            catch ( e ) {
                console.error("upload error: ", this.result['response'], e);
                failureCallback( 'json-parse-error' );
                if ( completeCallback ) completeCallback( 1 );
                return 0;
            }

            if ( re['error'] && re['error'] != '' ) {
                failureCallback( re['error'] );
                if ( completeCallback ) completeCallback( 1 );
                return;
            }

            // file upload success.
            successCallback( re );
            if ( completeCallback ) completeCallback( 0 );
            
        };
        this.uploader.onAfterAddingFile = ( fileItem ) => {
            console.log('uploader.onAfterAddingFile: begins to upload. ', fileItem);
            fileItem.withCredentials = false; // remove credentials
            fileItem.upload(); // upload file.
        }
    }



    delete( file: FILE_UPLOADED,
        successCallback: () => void,
        failureCallback: ( error: string ) => void,
        completeCallback?: () => void ) {
            let url = this.getDeleteUrl( file );
            console.log("going to delete!: ", url);
            this.http.get( url )
                .subscribe( re => {
                    let data;
                    try {
                        data = JSON.parse( re['_body'] );
                    }
                    catch( e ) {
                        console.error(e);
                        console.info(re);
                        return failureCallback('json-parse-error');
                    }
                    if ( data['error'] == '' ) successCallback();
                    else failureCallback( data['error'] );
                }, error => {
                    failureCallback('failed to delete file');
                }, completeCallback );
        }

    list( folder,
        successCallback: ( fileUploaded: Array<FILE_UPLOADED> ) => void,
        failureCallback: ( error: string ) => void,
        completeCallback?: () => void ) {

        let url = this.getListUrl( folder );
            console.log("going to list!: ", url);
            this.http.get( url )
                .subscribe( re => {
                    let data;
                    try {
                        data = JSON.parse( re['_body'] );
                    }
                    catch( e ) {
                        console.error(e);
                        console.info(re);
                        return failureCallback('json-parse-error');
                    }
                    let fileUploaded: Array<FILE_UPLOADED> = [];
                    data.map( e => {
                        let fu: FILE_UPLOADED = {
                            url: e
                        };
                        fileUploaded.push( fu );
                    });
                    successCallback( fileUploaded );
                }, error => {
                    failureCallback('failed to delete file');
                }, completeCallback );

    }

}

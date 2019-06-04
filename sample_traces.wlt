# sample VizWalT trace file

# we start by setting nodes at their
# position and adding a sample attribute
0.000:1:MoveTo:20,10,0
0.000:1:SerialLog:#A loc=Room-A
0.000:2:MoveTo:14,14,0
0.000:2:Attributes:loc=Room-B
0.000:3:MoveTo:23,15,0
0.000:3:Attributes:loc=Room-C
0.000:4:MoveTo:14,24,0
0.000:4:Attributes:loc=Room-E
0.000:5:MoveTo:20,23,0
0.000:5:Attributes:loc=Room-D
0.000:6:MoveTo:23,20,0
0.000:6:Attributes:loc=Room-D
0.000:7:MoveTo:17,19,0
0.000:7:Attributes:loc=Room-F

# let's start with radio off
0.000:1:RadioOff
0.000:2:RadioOff
0.000:3:RadioOff
0.000:4:RadioOff
0.000:5:RadioOff
0.000:6:RadioOff

# Here we simulate a little synchronization issue
# where timestamps of reception events are a few
# milliseconds before emission events.
# (VizWalT should be able to handle that.)
2.888:3:SerialLog:I will send a beacon.
2.888:3:SerialLog:#L 4 1;grey
2.888:3:SerialLog:#L 2 1;magenta
2.895:4:RadioOn
2.897:3:RadioOn
2.900:4:RxStart
2.905:4:RxEnd:02210100
2.906:3:TxStart:02210100
2.910:3:TxEnd
2.915:4:RadioOff
2.915:3:RadioOff

# Fire various packets
5.683:4:RadioOn
5.685:3:RadioOn
5.695:4:TxStart:026f4d2f9d60732b9221b7ac7d0deb
5.698:3:RxStart
5.715:4:TxEnd
5.719:3:RxEnd:026f4d2f9d60732b9221b7ac7d0deb
5.727:4:RadioOff
5.732:3:RadioOff
6.228:2:RadioOn
6.230:3:RadioOn
6.240:2:TxStart:9d0e2edab0ea
6.244:3:RxStart
6.260:2:TxEnd
6.264:3:RxEnd:9d0e2edab0ea
6.272:2:RadioOff
6.277:3:RadioOff
6.736:1:RadioOn
6.739:2:RadioOn
6.747:1:TxStart:05f3b7986de3ec291535
6.752:2:RxStart
6.767:1:TxEnd
6.771:2:RxEnd:05f3b7986de3ec291535
6.780:1:RadioOff
6.785:2:RadioOff
6.795:2:RadioOn
6.798:1:RadioOn
6.807:2:TxStart:3ed5897acc25228bfec100
6.811:1:RxStart
6.826:2:TxEnd
6.831:1:RxEnd:3ed5897acc25228bfec100
6.838:2:RadioOff
6.846:1:RadioOff
6.925:5:RadioOn
6.928:4:RadioOn
6.937:5:TxStart:fcb974e3a5ae
6.941:4:RxStart
6.957:5:TxEnd
6.960:4:RxEnd:fcb974e3a5ae
6.970:5:RadioOff
6.975:4:RadioOff
7.520:3:RadioOn
7.522:1:RadioOn
7.532:3:TxStart:e403889d8c8d82a5974944c9
7.535:1:RxStart
7.551:3:TxEnd
7.555:1:RxEnd:e403889d8c8d82a5974944c9
7.564:3:RadioOff
7.569:1:RadioOff
7.897:4:RadioOn
7.898:5:RadioOn
7.908:4:TxStart:f61c53aea290e8c3356e909d074199
7.912:5:RxStart
7.928:4:TxEnd
7.932:5:RxEnd:f61c53aea290e8c3356e909d074199
7.940:4:RadioOff
7.945:5:RadioOff
8.205:3:RadioOn
8.207:1:RadioOn
8.217:3:TxStart:626efa835aff5bd86a2067
8.220:1:RxStart
8.237:3:TxEnd
8.240:1:RxEnd:626efa835aff5bd86a2067
8.249:3:RadioOff
8.253:1:RadioOff
8.727:2:RadioOn
8.729:1:RadioOn
8.738:2:TxStart:48ed2531c1478e1059ec
8.742:1:RxStart
8.757:2:TxEnd
8.761:1:RxEnd:48ed2531c1478e1059ec
8.770:2:RadioOff
8.774:1:RadioOff
9.350:5:RadioOn
9.353:4:RadioOn
9.361:5:TxStart:f1ec36723c5e21e0f908ec
9.367:4:RxStart
9.381:5:TxEnd
9.387:4:RxEnd:f1ec36723c5e21e0f908ec
9.393:5:RadioOff
9.402:4:RadioOff
9.728:6:RadioOn
9.730:5:RadioOn
9.740:6:TxStart:44b0ee11d0ae27b8f0
9.742:5:RxStart
9.760:6:TxEnd
9.763:5:RxEnd:44b0ee11d0ae27b8f0
9.773:6:RadioOff
9.777:5:RadioOff
10.155:4:RadioOn
10.158:5:RadioOn
10.166:4:TxStart:3cab2c4b41e95a98
10.170:5:RxStart
10.186:4:TxEnd
10.191:5:RxEnd:3cab2c4b41e95a98
10.198:4:RadioOff
10.206:5:RadioOff
10.425:3:RadioOn
10.428:2:RadioOn
10.436:3:TxStart:bd61576f0565c8f6
10.440:2:RxStart
10.456:3:TxEnd
10.460:2:RxEnd:bd61576f0565c8f6
10.467:3:RadioOff
10.474:2:RadioOff
10.902:2:RadioOn
10.905:3:RadioOn
10.914:2:TxStart:a36fe6b75decb97ce8449c
10.918:3:RxStart
10.933:2:TxEnd
10.937:3:RxEnd:a36fe6b75decb97ce8449c
10.944:2:RadioOff
10.952:3:RadioOff
11.333:2:RadioOn
11.335:1:RadioOn
11.346:2:TxStart:21f42cf147e13be6
11.347:1:RxStart
11.366:2:TxEnd
11.368:1:RxEnd:21f42cf147e13be6
11.377:2:RadioOff
11.383:1:RadioOff
11.624:3:RadioOn
11.626:1:RadioOn
11.635:3:TxStart:656d34ea1b0314
11.639:1:RxStart
11.655:3:TxEnd
11.659:1:RxEnd:656d34ea1b0314
11.666:3:RadioOff
11.674:1:RadioOff
12.087:3:RadioOn
12.089:2:RadioOn
12.098:3:TxStart:8e73a24bf7e0266a51fd4bde
12.102:2:RxStart
12.119:3:TxEnd
12.122:2:RxEnd:8e73a24bf7e0266a51fd4bde
12.131:3:RadioOff
12.136:2:RadioOff
12.152:4:RadioOn
12.153:5:RadioOn
12.164:4:TxStart:f9c62c393a0eb45cde9b
12.166:5:RxStart
12.185:4:TxEnd
12.186:5:RxEnd:f9c62c393a0eb45cde9b
12.197:4:RadioOff
12.200:5:RadioOff
12.672:3:RadioOn
12.674:1:RadioOn
12.685:3:TxStart:123ddcadd72c6c053001df
12.686:1:RxStart
12.705:3:TxEnd
12.706:1:RxEnd:123ddcadd72c6c053001df
12.716:3:RadioOff
12.721:1:RadioOff
13.114:5:RadioOn
13.117:6:RadioOn
13.126:5:TxStart:bc47a58ad5a9
13.130:6:RxStart
13.146:5:TxEnd
13.151:6:RxEnd:bc47a58ad5a9
13.159:5:RadioOff
13.164:6:RadioOff
13.441:6:RadioOn
13.443:5:RadioOn
13.454:6:TxStart:014bbbca6665c834c45f956b8e28
13.456:5:RxStart
13.474:6:TxEnd
13.475:5:RxEnd:014bbbca6665c834c45f956b8e28
13.486:6:RadioOff
13.490:5:RadioOff
13.574:1:RadioOn
13.576:3:RadioOn
13.586:1:TxStart:f20e858ada77fcfb6512
13.586:2:RadioOn
13.588:3:RadioOn
13.590:3:RxStart
13.599:2:TxStart:932637300fc1fd8d
13.600:3:RxStart
13.606:1:TxEnd
13.610:3:RxEnd:f20e858ada77fcfb6512
13.617:1:RadioOff
13.619:2:TxEnd
13.619:3:RxEnd:932637300fc1fd8d
13.623:3:RadioOff
13.631:2:RadioOff
13.634:3:RadioOff
13.919:2:RadioOn
13.921:1:RadioOn
13.930:2:TxStart:9f7ebf26b13192fa58
13.934:1:RxStart
13.950:2:TxEnd
13.954:1:RxEnd:9f7ebf26b13192fa58
13.963:2:RadioOff
13.969:1:RadioOff
14.398:2:RadioOn
14.401:1:RadioOn
14.409:2:TxStart:2cb8b7ae327e
14.413:1:RxStart
14.430:2:TxEnd
14.433:1:RxEnd:2cb8b7ae327e
14.442:2:RadioOff
14.448:1:RadioOff
14.732:6:RadioOn
14.734:5:RadioOn
14.743:6:TxStart:ef1fb0ba942e459ab4a55f
14.748:5:RxStart
14.764:6:TxEnd
14.767:5:RxEnd:ef1fb0ba942e459ab4a55f
14.777:6:RadioOff
14.782:5:RadioOff
14.858:4:RadioOn
14.860:3:RadioOn
14.870:4:TxStart:cb01d531240cf81249c887041e81
14.873:3:RxStart
14.891:4:TxEnd
14.892:3:RxEnd:cb01d531240cf81249c887041e81
14.903:4:RadioOff
14.906:3:RadioOff
15.266:5:RadioOn
15.268:4:RadioOn
15.278:5:TxStart:ecd7f781
15.281:4:RxStart
15.290:3:RadioOn
15.291:4:RadioOn
15.298:5:TxEnd
15.300:4:RxEnd:ecd7f781
15.303:3:TxStart:024a9192d272ad2f7190
15.304:4:RxStart
15.310:5:RadioOff
15.313:4:RadioOff
15.323:3:TxEnd
15.323:4:RxEnd:024a9192d272ad2f7190
15.336:3:RadioOff
15.337:4:RadioOff
15.344:4:RadioOn
15.347:5:RadioOn
15.357:4:TxStart:e4df7180b7a96a75476d
15.359:5:RxStart
15.376:4:TxEnd
15.379:5:RxEnd:e4df7180b7a96a75476d
15.389:4:RadioOff
15.392:5:RadioOff
15.807:4:RadioOn
15.809:5:RadioOn
15.818:4:TxStart:f6393d1e0052f5885d5aecf680
15.823:5:RxStart
15.837:4:TxEnd
15.843:5:RxEnd:f6393d1e0052f5885d5aecf680
15.849:4:RadioOff
15.858:5:RadioOff
15.986:2:RadioOn
15.987:3:RadioOn
15.998:2:TxStart:44ee8acb26d0ca0708a67f7c
16.000:3:RxStart
16.019:2:TxEnd
16.021:3:RxEnd:44ee8acb26d0ca0708a67f7c
16.030:2:RadioOff
16.035:3:RadioOff
16.161:1:RadioOn
16.164:4:RadioOn
16.174:1:TxStart:8af034523d
16.176:4:RxStart
16.193:1:TxEnd
16.196:4:RxEnd:8af034523d
16.204:1:RadioOff
16.210:4:RadioOff
16.670:2:RadioOn
16.672:3:RadioOn
16.682:2:TxStart:7159e54198be90
16.684:3:RxStart
16.701:2:TxEnd
16.704:3:RxEnd:7159e54198be90
16.713:2:RadioOff
16.717:3:RadioOff
16.764:4:RadioOn
16.766:3:RadioOn
16.775:4:TxStart:1c0b76fde122605b02495412210d0b
16.779:3:RxStart
16.796:4:TxEnd
16.800:3:RxEnd:1c0b76fde122605b02495412210d0b
16.808:4:RadioOff
16.815:3:RadioOff
17.058:2:RadioOn
17.061:1:RadioOn
17.069:2:TxStart:52f6c431cb4717fbc7d1
17.074:1:RxStart
17.088:2:TxEnd
17.093:1:RxEnd:52f6c431cb4717fbc7d1
17.099:2:RadioOff
17.108:1:RadioOff
17.185:2:RadioOn
17.187:1:RadioOn
17.197:2:TxStart:07a530bd8cac
17.201:1:RxStart
17.216:2:TxEnd
17.222:1:RxEnd:07a530bd8cac
17.227:2:RadioOff
17.237:1:RadioOff
17.237:4:RadioOn
17.239:3:RadioOn
17.248:4:TxStart:3d7f93b49a
17.251:3:RxStart
17.268:4:TxEnd
17.271:3:RxEnd:3d7f93b49a
17.280:4:RadioOff
17.286:3:RadioOff
17.662:6:RadioOn
17.664:5:RadioOn
17.673:6:TxStart:bab5a60f
17.677:5:RxStart
17.692:6:TxEnd
17.697:5:RxEnd:bab5a60f
17.703:6:RadioOff
17.711:5:RadioOff
17.807:3:RadioOn
17.810:4:RadioOn
17.820:3:TxStart:5f4b5e50d154df78addd5ee5
17.824:4:RxStart
17.841:3:TxEnd
17.845:4:RxEnd:5f4b5e50d154df78addd5ee5
17.853:3:RadioOff
17.858:4:RadioOff
18.234:1:RadioOn
18.237:4:RadioOn
18.246:1:TxStart:176540d3e967bbaf8500111acb31
18.247:6:RadioOn
18.248:5:RadioOn
18.251:4:RxStart
18.259:6:TxStart:b9721d2ef290e796f9
18.260:5:RxStart
18.266:1:TxEnd
18.270:4:RxEnd:176540d3e967bbaf8500111acb31
18.279:1:RadioOff
18.279:5:RxEnd:b9721d2ef290e796f9
18.279:6:TxEnd
18.283:4:RadioOff
18.291:6:RadioOff
18.292:5:RadioOff
18.352:4:RadioOn
18.354:3:RadioOn
18.359:3:RadioOn
18.361:1:RadioOn
18.364:4:TxStart:930a94b5d394877d4b1e16b50402
18.366:3:RxStart
18.372:3:TxStart:bea8e2d6dadbfeca32b7
18.375:1:RxStart
18.375:4:RadioOn
18.377:3:RadioOn
18.384:4:TxEnd
18.386:3:RxEnd:930a94b5d394877d4b1e16b50402
18.387:4:TxStart:36e1762511b3dbcd55c132a934
18.390:3:RxStart
18.393:2:RadioOn
18.393:3:TxEnd
18.395:1:RadioOn
18.395:4:RadioOff
18.396:1:RxEnd:bea8e2d6dadbfeca32b7
18.401:3:RadioOff
18.405:3:RadioOff
18.406:4:TxEnd
18.406:2:TxStart:703997eb69242a3cb492
18.408:1:RxStart
18.409:3:RxEnd:36e1762511b3dbcd55c132a934
18.410:1:RadioOff
18.417:4:RadioOff
18.423:3:RadioOff
18.427:1:RxEnd:703997eb69242a3cb492
18.427:2:TxEnd
18.438:2:RadioOff
18.440:1:RadioOff
18.963:1:RadioOn
18.964:3:RadioOn
18.975:1:TxStart:6a847824
18.976:3:RxStart
18.995:1:TxEnd
18.995:3:RxEnd:6a847824
19.008:1:RadioOff
19.009:3:RadioOff
19.041:6:RadioOn
19.042:5:RadioOn
19.052:6:TxStart:e46bda29aaf0c477bcef6417d07178
19.055:5:RxStart
19.073:6:TxEnd
19.075:2:RadioOn
19.076:5:RxEnd:e46bda29aaf0c477bcef6417d07178
19.077:3:RadioOn
19.085:6:RadioOff
19.087:2:TxStart:d755471ab536
19.090:3:RxStart
19.090:5:RadioOff
19.107:2:TxEnd
19.110:3:RxEnd:d755471ab536
19.118:2:RadioOff
19.125:3:RadioOff
19.536:6:RadioOn
19.539:5:RadioOn
19.547:6:TxStart:524cba0ee9f419bfe2e71d8e841d36
19.552:5:RxStart
19.566:6:TxEnd
19.572:5:RxEnd:524cba0ee9f419bfe2e71d8e841d36
19.577:6:RadioOff
19.586:5:RadioOff
19.837:1:RadioOn
19.840:4:RadioOn
19.849:1:TxStart:13153d69602122
19.853:4:RxStart
19.862:1:RadioOn
19.865:4:RadioOn
19.869:1:TxEnd
19.872:4:RxEnd:13153d69602122
19.874:1:TxStart:668c58a9b98ffd19dc94f5cd23ff
19.878:4:RxStart
19.882:1:RadioOff
19.882:5:RadioOn
19.885:6:RadioOn
19.887:4:RadioOff
19.893:1:TxEnd
19.895:5:TxStart:bfaebee266
19.897:4:RxEnd:668c58a9b98ffd19dc94f5cd23ff
19.898:6:RxStart
19.906:1:RadioOff
19.912:4:RadioOff
19.913:1:RadioOn
19.914:3:RadioOn
19.914:5:TxEnd
19.919:6:RxEnd:bfaebee266
19.925:1:TxStart:9648227563fc
19.926:3:RxStart
19.926:5:RadioOff
19.932:6:RadioOff
19.945:1:TxEnd
19.946:3:RxEnd:9648227563fc
19.948:4:RadioOn
19.950:1:RadioOn
19.957:1:RadioOff
19.959:3:RadioOff
19.960:4:TxStart:e4e70ea15ace649e2da6b29e07
19.962:3:RadioOn
19.963:1:RadioOn
19.963:1:RxStart
19.973:3:TxStart:c11b6aa9587bd35e61
19.976:1:RxStart
19.980:4:TxEnd
19.983:1:RxEnd:e4e70ea15ace649e2da6b29e07
19.993:3:TxEnd
19.993:4:RadioOff
19.997:1:RadioOff
19.997:1:RxEnd:c11b6aa9587bd35e61
20.006:3:RadioOff
20.010:1:RadioOff
20.160:5:RadioOn
20.163:4:RadioOn
20.171:5:TxStart:15b5d2a6272fe0ab5b
20.177:4:RxStart
20.191:5:TxEnd
20.196:4:RxEnd:15b5d2a6272fe0ab5b
20.202:5:RadioOff
20.209:4:RadioOff
20.278:4:RadioOn
20.280:5:RadioOn
20.289:4:TxStart:196a3a18
20.294:5:RxStart
20.300:1:RadioOn
20.303:4:RadioOn
20.309:5:RadioOn
20.310:4:TxEnd
20.310:6:RadioOn
20.313:1:TxStart:dfd3c2c085152047
20.314:5:RxEnd:196a3a18
20.316:4:RxStart
20.320:5:TxStart:50d3d1ca0303
20.323:4:RadioOff
20.324:6:RxStart
20.329:5:RadioOff
20.334:1:TxEnd
20.336:4:RxEnd:dfd3c2c085152047
20.339:5:TxEnd
20.344:6:RxEnd:50d3d1ca0303
20.346:1:RadioOff
20.351:5:RadioOff
20.351:4:RadioOff
20.358:6:RadioOff

# notify that we will end
21.350:1:SerialLog:End of test.
21.350:2:SerialLog:End of test.
21.350:3:SerialLog:End of test.
21.350:4:SerialLog:End of test.

# exit
23.000:sys:Exit

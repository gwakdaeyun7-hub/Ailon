---
difficulty: intermediate
connectionType: reverse_inspiration
keywords: 시냅스 가소성, 역전파, 장기 강화, 스파이크 타이밍 의존 가소성, 가중치 전달 문제, 피드백 정렬, 예측 부호화, Forward-Forward
keywords_en: synaptic plasticity, backpropagation, long-term potentiation, spike-timing-dependent plasticity, weight transport problem, feedback alignment, predictive coding, Forward-Forward
---
Synaptic Plasticity and the Backpropagation Debate - 역전파의 생물학적 불가능성에 대한 신경과학의 비판이 피드백 정렬, 예측 부호화, Forward-Forward 등 새로운 AI 학습 알고리즘을 촉발한 사례

## 시냅스 가소성: 뇌가 배선을 바꾸는 방법

1949년, 심리학자 Donald Hebb은 학습의 신경학적 메커니즘에 관한 가설을 제시했다. 뉴런 A가 반복적으로 뉴런 B의 발화에 관여하면, 둘 사이의 시냅스 연결이 강화된다. "함께 발화하는 뉴런은 함께 연결된다"(Neurons that fire together, wire together)로 요약되는 이 가설은 당시 순수한 이론이었다.

실험적 증거는 24년 후에 나왔다. 1973년, Tim Bliss와 Terje Lomo는 토끼 해마(hippocampus)에서 **장기 강화**(Long-Term Potentiation, LTP)를 발견했다. 시냅스 전 뉴런에 고빈도 전기 자극(초당 100회)을 1초 동안 가하면, 시냅스 전달 효율이 수 시간에서 수 주까지 지속적으로 증가하는 현상이었다. 이후 그 반대 현상인 **장기 억압**(Long-Term Depression, LTD)도 확인되었다. 저빈도 자극(초당 1~5회)을 수 분간 가하면 시냅스 효율이 감소하는 것이다. 배선을 강화하는 메커니즘(LTP)과 약화하는 메커니즘(LTD)이 함께 작동해야 뇌가 새로운 것을 배우면서도 이전 학습이 무한히 누적되지 않는다.

이것을 공간적으로 상상하면 이렇다. 뇌의 시냅스 연결을 도로망이라 하자. 자주 쓰이는 도로는 넓어지고(LTP), 안 쓰이는 도로는 좁아진다(LTD). 도로를 넓히기만 하고 좁히지 않으면, 결국 모든 도로가 고속도로가 되어 교통 신호가 의미 없어지는 것과 같다. 인간의 대뇌 피질에는 약 100조 개의 시냅스가 있다. 이 방대한 도로망에서 LTP와 LTD의 균형이 뇌 학습의 기초를 형성한다.

1997년, Henry Markram은 시냅스 가소성의 이해를 한 단계 더 구체화했다. **STDP**(Spike-Timing-Dependent Plasticity, 스파이크 타이밍 의존 가소성)의 발견이다. 규칙은 단순하다.

- 시냅스 전 뉴런이 **먼저** 발화하고, 시냅스 후 뉴런이 **뒤따라** 발화하면 (dt > 0) --> 시냅스 강화 (LTP)
- 시냅스 후 뉴런이 **먼저** 발화하고, 시냅스 전 뉴런이 **뒤따라** 발화하면 (dt < 0) --> 시냅스 약화 (LTD)

수학적으로 가중치 변화량은 다음과 같다.

dt > 0일 때: dw = A+ * exp(-dt / tau+)
dt < 0일 때: dw = -A- * exp(dt / tau-)

dt = t_post - t_pre (시냅스 후 뉴런 발화 시점 - 시냅스 전 뉴런 발화 시점)이다. A+와 A-는 각각 강화와 약화의 최대 크기이고, tau+와 tau-는 시간 상수로 보통 약 20ms다. 수식의 극단을 따라가면 의미가 드러난다. dt = +1ms(거의 동시 발화, 전 뉴런이 약간 먼저)이면 exp(-1/20) = 0.95이므로 최대치의 95%에 달하는 강한 강화가 일어난다. dt = +50ms(상당한 시간차)이면 exp(-50/20) = 0.08, 즉 최대치의 8%에 불과한 미미한 강화가 일어난다. dt = -10ms(후 뉴런이 먼저 발화)이면 약화가 일어나는데, exp(10/20) 대신 exp(-10/20)을 적용하면 최대 약화량의 약 61%다. 핵심은 밀리초 단위의 시간 순서가 시냅스 변화의 방향과 크기를 모두 결정한다는 것이다.

STDP가 Hebb 규칙의 정교한 버전인 이유는 이것이다. 시냅스 전 뉴런이 시냅스 후 뉴런의 발화에 인과적으로 기여했을 가능성이 높은 경우(전 -> 후 순서)에만 연결을 강화한다. 두 뉴런의 발화 **시간 순서**가 **인과 관계의 대리 지표**(proxy)로 작동하는 것이다. 뇌는 상관관계와 인과관계를 시간 순서라는 단서로 구분한다.

## 역전파: 완전히 다른 원리로 작동하는 AI의 학습법

AI 신경망 학습의 표준 알고리즘인 역전파(backpropagation)는 뇌의 학습 원리와 근본적으로 다르다. 역전파의 수학적 핵심인 자동 미분(automatic differentiation)은 Linnainmaa(1970)가 처음 형식화했고, Werbos(1974)가 이를 신경망 학습에 적용할 수 있다고 제안했으며, Rumelhart, Hinton & Williams(1986)가 다층 퍼셉트론에서의 유효성을 실험적으로 보여주면서 널리 퍼졌다. 이 알고리즘은 미적분학의 연쇄 법칙(chain rule)에 기반한다.

1. 순전파(forward pass): 입력 데이터가 네트워크를 앞 방향으로 통과하며 예측값을 만든다
2. 손실 계산: 예측값과 정답의 차이를 손실 함수 L로 측정한다
3. 역전파(backward pass): 출력층에서 입력층 방향으로, 각 가중치가 손실에 얼마나 기여했는지를 연쇄 법칙으로 계산한다
4. 가중치 갱신: 기울기의 반대 방향으로 가중치를 조정한다 -- w_new = w_old - lr * dL/dw

핵심 수식은 이렇다.

dL/dw_ij = dL/da_j * da_j/dz_j * dz_j/dw_ij

L은 손실, w_ij는 뉴런 i에서 j로의 가중치, a_j는 j의 활성화 출력값, z_j는 가중합(i에서 들어오는 입력의 가중 합)이다. 각 항을 곱해 나가면 출력층의 오차 정보가 네트워크를 **역방향으로** 전파된다. 이것이 "역전파"라는 이름의 유래다. 마지막 항 dz_j/dw_ij는 단순히 뉴런 i의 출력값이 되므로, 역전파가 계산하는 것은 결국 "이 가중치를 아주 조금 바꿨을 때 최종 손실이 얼마나 변하는가"에 대한 정확한 답이다.

## 역전파는 왜 뇌에서 일어날 수 없는가: 네 가지 구조적 충돌

역전파가 생물학적으로 불가능한 이유는 적어도 네 가지다. 이 비판들이 단순한 학술적 지적을 넘어 이후 대안적 학습 알고리즘 연구의 출발점이 된다.

**1. 가중치 전달 문제(weight transport problem)**: 역전파에서 오차를 역방향으로 보내려면, 역방향 경로가 순방향 경로의 가중치를 **정확히 알아야** 한다. 수학적으로, 역전파에 사용되는 행렬은 순방향 가중치 행렬 W의 전치(transpose), 즉 W^T다. 그런데 생물학적 시냅스는 단방향이다. 뉴런 A에서 뉴런 B로의 축삭(axon) 연결과, B에서 A 방향의 연결은 서로 다른 세포막 위에 존재하는 별개의 구조물이다. A->B 연결의 강도를 B->A 연결이 "읽어올" 물리적 메커니즘이 없다. 이것은 회사 조직에서 부장이 사원에게 지시를 내린 경로(순방향)를 따라, 사원이 부장에게 정확히 같은 강도로 피드백을 보내야 하는데, 사원은 부장이 어떤 강도로 지시했는지 알 방법이 없는 것과 비슷하다.

**2. 전역 오차 신호의 부재**: 역전파는 네트워크 출력단에서 전역 오차를 계산한 뒤 이를 모든 층에 전파한다. 생물학적 뉴런의 학습은 **지역적**(local)이다. 시냅스의 변화는 그 시냅스 전후 뉴런의 활동에만 기반한다. 대뇌 피질에서 수백만 시냅스 떨어진 출력단의 오차 정보가 특정 시냅스 하나에 정확히 도달하는 경로는 알려져 있지 않다. STDP가 보여주듯, 뇌의 학습 규칙은 바로 인접한 두 뉴런의 발화 타이밍만으로 결정된다.

**3. 분리된 두 단계**: 역전파는 순전파가 **완전히 끝난 후에야** 역전파를 시작하는 이산적(discrete) 2단계 구조다. 생물학적 뉴런은 연속적으로 신호를 주고받으며, 이런 깔끔한 단계 분리가 없다. 뉴런이 "지금은 순전파 시간이니 역전파는 기다려라"라고 할 수 있는 메커니즘이 없다.

**4. 대칭 가중치**: 1번의 연장인데, 순방향과 역방향 경로의 가중치가 정확히 전치(transpose) 관계여야 한다는 것이다. 생물학적 신경 회로에서 이런 수학적으로 정밀한 대칭은 관찰되지 않는다. 뇌의 연결은 비대칭적이고 확률적이다.

뇌의 학습(STDP)과 역전파의 대조를 명확히 하면 이렇다.

- 학습 신호의 원천: STDP는 **인접 뉴런 쌍의 발화 타이밍**(지역적) --> 역전파는 **출력단 손실 함수의 기울기**(전역적)
- 가중치 변화 방향: STDP는 **시간 순서**(인과성의 대리) --> 역전파는 **손실을 줄이는 정확한 수학적 방향**
- 필요한 정보: STDP는 **직접 연결된 두 뉴런의 스파이크 시점만** --> 역전파는 **네트워크 전체의 가중치와 활성값**
- 생물학적 구현: STDP는 **관찰된 현상** --> 역전파는 **물리적으로 불가능**

## 성능과 생물학적 타당성의 트레이드오프

이 네 가지 비판이 만들어낸 상황은 역설적이다. 역전파는 AI 역사상 가장 성공적인 학습 알고리즘이지만, 뇌가 사용하는 원리와는 가장 먼 알고리즘이기도 하다. 이 긴장이 **역방향 영감**(reverse inspiration)의 동력이 된다. 보통 학제간 영감은 "학문 A의 원리가 AI 기법 B에 영감을 준다"는 구조다. 여기서는 정반대로, AI 기법(역전파)의 결함에 대한 신경과학의 비판이 새로운 AI 기법을 촉발한 것이다.

핵심 트레이드오프는 이렇다.

- 역전파: GPT 계열에서 1750억 파라미터까지 안정적으로 학습. ImageNet top-5 정확도 98% 이상. 그러나 생물학적으로 불가능
- 생물학적 대안들: 뇌의 학습 방식에 가깝지만, CIFAR-10(10종 이미지 분류) 기준으로도 역전파 대비 5~15% 이상의 정확도 격차. 대규모 확장 가능성 미지수

이 격차를 좁히려는 시도가 아래의 연구 프로그램들이다.

## 신경과학 비판이 촉발한 대안적 학습 알고리즘

**피드백 정렬(Feedback Alignment)** -- Lillicrap et al.(2016): 가중치 전달 문제(비판 1번)에 대한 가장 직접적인 해법이다. 역방향 경로에 순방향 가중치 행렬의 전치 W^T 대신 **무작위로 초기화한 고정 행렬 B**를 사용해도 학습이 작동한다는 것을 보였다. 어떻게 가능한가? 학습이 진행되면서 순방향 가중치 W가 점차 무작위 행렬 B와 정렬(align)되어, 정확한 기울기는 아니지만 "대략 맞는 방향"의 오차 신호를 전달하게 된다. 기울기 방향의 코사인 유사도가 학습 초기 거의 0에서 점차 양의 값으로 증가하는 것이 실험적으로 관찰되었다. 이것은 뇌가 정확한 가중치 대칭 없이도 유용한 학습 신호를 만들 수 있음을 시사한다. 다만 심층 네트워크(10층 이상의 CNN 등)에서는 역전파 대비 정확도 격차가 벌어지며, MNIST에서는 비슷한 성능을 내지만 CIFAR-10에서는 약 5% 이상 뒤처진다.

**예측 부호화(Predictive Coding)** -- Rao & Ballard(1999): 뇌는 끊임없이 감각 입력을 **예측**하고, 예측과 실제 입력의 차이인 **예측 오차**만을 상위 영역으로 전달한다는 이론이다. 각 층이 바로 아래 층의 활동을 예측하고 오차를 계산하므로, 학습이 본질적으로 **지역적**이다. 출력단의 전역 오차를 역전파할 필요가 없다. 이것은 비판 2번(전역 오차 신호)을 정면으로 해소한다. Whittington & Bogacz(2017)는 수학적으로 예측 부호화가 특정 조건(각 층이 평형에 도달할 때까지 반복)에서 역전파와 동일한 기울기를 산출함을 증명했다. 그러나 이 수렴 조건 자체가 추가 계산을 요구하며, ImageNet 같은 대규모 벤치마크에서의 실험적 검증은 아직 부족하다.

**평형 전파(Equilibrium Propagation)** -- Scellier & Bengio(2017): 네트워크를 에너지 기반 시스템으로 본다. "자유 단계"(입력만 주고 네트워크가 에너지 최소 상태에 도달)와 "고정 단계"(정답 신호를 약한 강도 beta로 주입하고 에너지 최소 상태에 도달)의 뉴런 활성값 차이를 beta로 나누면 기울기의 근사치가 된다. 분리된 순전파/역전파 단계가 필요 없다는 점에서 비판 3번을 해소하지만, 대칭 가중치를 여전히 가정하며(비판 4번 미해결) 적용 가능한 네트워크 구조가 제한적이다.

**Forward-Forward 알고리즘** -- Hinton(2022): 역전파를 완전히 제거한다. 각 층이 독립적으로 "이 입력이 진짜 데이터인가 가짜 데이터인가"를 판단하는 지역적 목적 함수를 최적화한다. 순전파만 두 번 -- 한 번은 실제 데이터(양성)로, 한 번은 의도적으로 만든 잘못된 데이터(음성)로 -- 수행하며, 역방향 경로 자체가 존재하지 않는다. 비판 1번(가중치 전달), 2번(전역 오차), 3번(분리 단계)을 모두 회피한다. 그러나 CIFAR-10에서 역전파 기반 네트워크가 95% 이상의 정확도를 달성하는 데 비해 Forward-Forward는 약 80% 수준에 머물러, 성능 격차가 현재 가장 큰 한계다.

## 현대 AI 기법과의 연결

뇌의 학습 원리와 AI 학습 알고리즘의 관계는 두 가지 성격으로 나뉜다.

**역방향 영감 -- 신경과학 비판이 AI 기법을 촉발한 경우:**

- 피드백 정렬, 예측 부호화, 평형 전파, Forward-Forward는 모두 역전파의 생물학적 비현실성에 대한 신경과학 커뮤니티의 구체적 비판(가중치 전달, 전역 오차, 단계 분리, 대칭 가중치)에 대응하여 제안된 것이다. AI 기법의 결함을 신경과학이 지적하고, 그 지적이 새로운 AI 기법의 설계 제약 조건이 된 구조다
- **Spiking Neural Networks(SNN)**: 뇌의 STDP 규칙을 직접 구현하여 학습하는 네트워크. Intel의 Loihi 칩(2018)은 STDP 기반 학습을 뉴로모픽 하드웨어로 구현했다. 128코어, 13만 뉴런을 집적하여 역전파 없이 지역적 학습 규칙만으로 패턴을 학습한다. 추론 시 소비 전력이 기존 GPU 대비 수백 배 낮은 에너지 효율을 보이나, 분류 정확도는 역전파 기반 네트워크에 미치지 못한다

**구조적 유사성 -- 독립적으로 발전했지만 구조가 닮은 경우:**

- **Hebb 규칙과 비지도 학습**: Oja(1982)가 Hebb 규칙에 정규화항을 추가하여 가중치가 무한히 커지는 문제를 해결했다. 갱신 규칙은 dw = lr * (x * y - y^2 * w)로, 원래 Hebb 항(x * y)에서 망각 항(y^2 * w)을 빼는 구조다. 이것은 주성분 분석(PCA)의 온라인 버전과 수학적으로 동치가 된다. Hebb 규칙에서 영감을 받았으나, 최종 결과는 선형대수학의 고유값 분해와 동일하므로 생물학적 연결보다는 수학적 수렴이다
- **Contrastive Hebbian Learning**: 볼츠만 머신의 학습 규칙은 자유 단계와 고정 단계에서의 뉴런 쌍 상관관계 차이로 가중치를 갱신한다. Hebb 규칙과 형태가 유사하지만, Ackley, Hinton & Sejnowski(1985)의 볼츠만 머신은 통계역학에서 독립적으로 유도된 것이다

## 한계와 약점

- **비교 기준의 비대칭**: 역전파는 지도 학습(supervised learning)에 최적화되어 있지만, 뇌의 학습은 대부분 비지도 또는 자기지도(self-supervised)에 가깝다. 뇌에는 정답 레이블을 제공하는 교사가 없다. 둘을 CIFAR-10 같은 지도학습 벤치마크로 비교하는 것 자체가 공정하지 않을 수 있다
- **규모 확장의 미지수**: 역전파의 성공은 수십억 파라미터 규모에서 가장 뚜렷하다. 생물학적 대안들은 MNIST(손글씨 숫자, 6만 장)나 CIFAR-10(일상 사물, 6만 장) 같은 소규모 실험에서만 검증되었으며, ImageNet(1400만 장)이나 대규모 언어 모델로의 확장 가능성은 아직 열린 문제다
- **생물학적 타당성의 스펙트럼**: "생물학적으로 그럴듯한"은 이분법이 아니라 연속적 스펙트럼이다. 피드백 정렬은 가중치 전달 문제를 해결하지만 여전히 분리된 단계를 사용한다. Forward-Forward는 역방향 경로를 제거하지만 양성/음성 데이터 구분이라는 비생물학적 요소를 도입한다. 평형 전파는 분리 단계를 없애지만 대칭 가중치를 가정한다. 네 가지 비판을 동시에 해소하는 방법은 아직 없다
- **뇌가 최적화를 하는가**: 역전파는 명시적 손실 함수의 최적화를 전제한다. 뇌가 특정 손실 함수를 최적화하는지, 아니면 근본적으로 다른 계산 원리(예를 들어, 자유 에너지 최소화 같은 일반 원리)를 사용하는지는 열린 질문이다. 이 전제가 틀리면, 역전파의 "생물학적 대안"을 찾는 방향 자체가 잘못된 질문일 수 있다

## 용어 정리

시냅스 가소성(synaptic plasticity) - 경험에 의해 시냅스 연결 강도가 변화하는 뇌의 성질. 학습과 기억의 신경학적 기초

장기 강화(Long-Term Potentiation, LTP) - 고빈도 자극 후 시냅스 전달 효율이 수 시간에서 수 주까지 지속적으로 증가하는 현상. Bliss & Lomo(1973) 발견

장기 억압(Long-Term Depression, LTD) - 저빈도 자극 후 시냅스 전달 효율이 감소하는 현상. LTP의 반대 방향으로, 둘의 균형이 학습 안정성을 유지

스파이크 타이밍 의존 가소성(STDP) - 시냅스 전후 뉴런의 발화 시간 차이(밀리초 단위)에 따라 시냅스 강도가 변하는 규칙. Markram(1997) 발견

역전파(backpropagation) - 연쇄 법칙으로 출력 오차에 대한 각 가중치의 기울기를 역방향으로 계산하는 알고리즘. Linnainmaa(1970) 형식화, Werbos(1974) 신경망 적용 제안, Rumelhart, Hinton & Williams(1986) 대중화

가중치 전달 문제(weight transport problem) - 역전파가 역방향 경로에서 순방향 가중치 행렬의 정확한 전치(W^T)를 요구하는 가정. 생물학적 시냅스에는 이를 구현할 메커니즘이 없다

피드백 정렬(feedback alignment) - 역방향 경로에 무작위 고정 행렬을 사용해도 학습이 작동함을 보인 방법. 순방향 가중치가 점차 피드백 행렬에 정렬된다. Lillicrap et al.(2016)

예측 부호화(predictive coding) - 뇌가 감각 입력을 예측하고 예측 오차만 상위 영역에 전파한다는 이론. 전역 오차 신호 없이 지역적 학습 가능. Rao & Ballard(1999)

연쇄 법칙(chain rule) - 합성 함수의 미분을 각 구성 함수 미분의 곱으로 분해하는 미적분학 법칙. 역전파의 수학적 기초

Forward-Forward 알고리즘 - 역방향 경로 없이 양성/음성 데이터를 구분하도록 각 층을 독립적으로 학습시키는 방법. Hinton(2022) 제안

---EN---
Synaptic Plasticity and the Backpropagation Debate - How neuroscience's critique of backpropagation's biological impossibility sparked new AI learning algorithms: feedback alignment, predictive coding, and Forward-Forward

## Synaptic Plasticity: How the Brain Rewires Itself

In 1949, psychologist Donald Hebb proposed a hypothesis about the neurological mechanism of learning: if neuron A repeatedly contributes to the firing of neuron B, the synaptic connection between them strengthens. Commonly summarized as "Neurons that fire together, wire together," this hypothesis was purely theoretical at the time.

Experimental evidence came 24 years later. In 1973, Tim Bliss and Terje Lomo discovered **Long-Term Potentiation (LTP)** in the rabbit hippocampus -- a phenomenon where high-frequency electrical stimulation (100 pulses per second) applied to a presynaptic neuron for one second produced sustained increases in synaptic transmission efficiency lasting hours to weeks. Subsequently, the opposite phenomenon, **Long-Term Depression (LTD)**, was confirmed: low-frequency stimulation (1-5 pulses per second) applied over several minutes decreases synaptic efficiency. The brain needs both a mechanism for strengthening connections (LTP) and weakening them (LTD) -- otherwise new learning would accumulate indefinitely without pruning.

To visualize this spatially: think of the brain's synaptic connections as a road network. Frequently used roads widen (LTP), while unused roads narrow (LTD). If you only widen roads and never narrow them, eventually every road becomes a highway and traffic signals become meaningless. The human cerebral cortex contains roughly 100 trillion synapses. Across this vast road network, the balance between LTP and LTD forms the foundation of brain learning.

In 1997, Henry Markram further refined our understanding of synaptic plasticity by discovering **STDP** (Spike-Timing-Dependent Plasticity). The rule is simple:

- If the presynaptic neuron fires **first** and the postsynaptic neuron fires **after** (dt > 0) --> synaptic strengthening (LTP)
- If the postsynaptic neuron fires **first** and the presynaptic neuron fires **after** (dt < 0) --> synaptic weakening (LTD)

Mathematically, the weight change is:

When dt > 0: dw = A+ * exp(-dt / tau+)
When dt < 0: dw = -A- * exp(dt / tau-)

Here dt = t_post - t_pre (postsynaptic firing time minus presynaptic firing time). A+ and A- represent the maximum magnitudes of strengthening and weakening respectively, and tau+ and tau- are time constants typically around 20ms. Tracing the extremes of the formula reveals its meaning. At dt = +1ms (near-simultaneous firing, presynaptic slightly first), exp(-1/20) = 0.95, so strengthening reaches 95% of its maximum -- strong reinforcement. At dt = +50ms (substantial time gap), exp(-50/20) = 0.08, meaning only 8% of maximum strengthening -- negligible. At dt = -10ms (postsynaptic fires first), weakening occurs at about 61% of its maximum magnitude, since exp(-10/20) = 0.61. The key insight: millisecond-scale timing determines both the direction and magnitude of synaptic change.

Why STDP is a refined version of Hebb's rule is clear: it strengthens connections only when the presynaptic neuron likely causally contributed to the postsynaptic neuron's firing (pre-before-post order). The **temporal order** of the two neurons' firing serves as a **proxy for causality**. The brain distinguishes correlation from causation using timing as its cue.

## Backpropagation: AI's Learning Method Built on Entirely Different Principles

Backpropagation, the standard algorithm for training neural networks in AI, is fundamentally different from the brain's learning principles. The mathematical core of backpropagation -- automatic differentiation -- was first formalized by Linnainmaa (1970). Werbos (1974) proposed its application to neural network training, and Rumelhart, Hinton & Williams (1986) demonstrated its effectiveness in multilayer perceptrons, bringing it into widespread use. The algorithm is based on the chain rule from calculus.

1. Forward pass: Input data passes through the network in the forward direction to produce a prediction
2. Loss computation: The difference between prediction and target is measured by a loss function L
3. Backward pass: From the output layer toward the input layer, the chain rule computes how much each weight contributed to the loss
4. Weight update: Weights are adjusted in the opposite direction of the gradient -- w_new = w_old - lr * dL/dw

The core formula is:

dL/dw_ij = dL/da_j * da_j/dz_j * dz_j/dw_ij

L is the loss, w_ij is the weight from neuron i to j, a_j is j's activation output, and z_j is the weighted sum (the sum of inputs from neuron i weighted by their connections). Multiplying each term propagates the output error information **backward** through the network -- hence the name "backpropagation." The last term dz_j/dw_ij is simply the output of neuron i, so what backpropagation ultimately computes is the precise answer to "how much would the final loss change if this weight were nudged by a tiny amount?"

## Why Backpropagation Cannot Occur in the Brain: Four Structural Conflicts

There are at least four reasons backpropagation is biologically impossible. These criticisms went beyond mere academic observations to become the starting point for alternative learning algorithm research.

**1. Weight Transport Problem**: To send errors backward, the backward pathway must **exactly know** the forward pathway's weights. Mathematically, the matrix used in backpropagation is the transpose of the forward weight matrix W, namely W^T. But biological synapses are unidirectional. The axonal connection from neuron A to neuron B and any connection in the B-to-A direction are separate structures on different cell membranes. There is no physical mechanism for the B-to-A connection to "read" the strength of the A-to-B connection. This is analogous to a corporate hierarchy where feedback from a junior employee to a senior manager must exactly mirror the strength of the original directive -- but the employee has no way of knowing how strongly the manager issued the directive.

**2. Absence of a global error signal**: Backpropagation computes a global error at the network output and propagates it to all layers. Biological neuron learning is **local** -- synaptic changes are based only on activity of the neurons immediately before and after that synapse. No known pathway exists for output error information, millions of synapses away in the cortex, to reach one specific synapse with precision. As STDP demonstrates, the brain's learning rules are determined solely by the firing timing of two directly adjacent neurons.

**3. Separated phases**: Backpropagation is a discrete two-phase structure where the backward pass begins only after the forward pass is **completely finished**. Biological neurons continuously exchange signals without such clean phase separation. There is no mechanism for a neuron to say "it's forward pass time now, so wait for the backward pass."

**4. Symmetric weights**: An extension of point 1: forward and backward pathway weights must be in an exact transpose relationship. Such mathematically precise symmetry is not observed in biological neural circuits. Brain connections are asymmetric and stochastic.

The contrast between brain learning (STDP) and backpropagation can be stated clearly:

- Source of learning signal: STDP uses **firing timing of adjacent neuron pairs** (local) --> backpropagation uses **gradients of the output loss function** (global)
- Direction of weight change: STDP uses **temporal order** (proxy for causality) --> backpropagation uses **the precise mathematical direction that reduces loss**
- Required information: STDP needs only **spike times of two directly connected neurons** --> backpropagation needs **weights and activations across the entire network**
- Biological implementation: STDP is **an observed phenomenon** --> backpropagation is **physically impossible**

## The Tradeoff Between Performance and Biological Plausibility

The situation created by these four criticisms is paradoxical. Backpropagation is the most successful learning algorithm in AI history, yet it is also the furthest from the principles the brain uses. This tension drives **reverse inspiration**. The typical pattern of interdisciplinary inspiration is "a principle from discipline A inspires AI technique B." Here the direction is inverted: neuroscience's critique of an AI technique's (backpropagation's) flaws catalyzes new AI techniques.

The core tradeoff is:

- Backpropagation: Stably trains models up to 175 billion parameters in the GPT family. Over 98% top-5 accuracy on ImageNet. But biologically impossible
- Biological alternatives: Closer to how the brain learns, but at least 5-15% behind backpropagation in accuracy even on CIFAR-10 (10-class image classification). Large-scale scaling potential unknown

The research programs below are attempts to narrow this gap.

## Alternative Learning Algorithms Catalyzed by Neuroscience Critique

**Feedback Alignment** -- Lillicrap et al. (2016): The most direct solution to the weight transport problem (criticism #1). They showed that learning works even when using **random, fixed matrices B** instead of the forward weight matrix's transpose W^T in the backward pathway. How is this possible? As learning progresses, the forward weights W gradually align with the random matrix B, eventually conveying error signals in "roughly the right direction," if not the exact gradient. The cosine similarity between the gradient direction and feedback signal has been experimentally observed to increase from near zero at the start of training to positive values. This suggests the brain could produce useful learning signals without precise weight symmetry. However, in deep networks (CNNs with 10+ layers), the accuracy gap compared to backpropagation widens: performance is comparable on MNIST but falls behind by roughly 5% or more on CIFAR-10.

**Predictive Coding** -- Rao & Ballard (1999): The theory that the brain constantly **predicts** sensory input and transmits only the **prediction error** -- the difference between prediction and actual input -- to higher regions. Since each layer predicts and computes errors for the layer directly below, learning is inherently **local**. No need to backpropagate global errors. This directly addresses criticism #2 (global error signal). Whittington & Bogacz (2017) proved mathematically that predictive coding produces gradients identical to backpropagation under specific conditions (when each layer iterates until reaching equilibrium). However, this convergence condition itself requires additional computation, and large-scale experimental validation on benchmarks like ImageNet remains insufficient.

**Equilibrium Propagation** -- Scellier & Bengio (2017): Views the network as an energy-based system. During a "free phase," only input is given and the network reaches its energy minimum. During a "clamped phase," the target signal is weakly injected at strength beta and the network reaches a new energy minimum. Dividing the difference in neuron activations between these phases by beta approximates the gradient. This addresses criticism #3 by eliminating separated forward/backward phases, but still assumes symmetric weights (criticism #4 unresolved) and is limited to certain network architectures.

**Forward-Forward Algorithm** -- Hinton (2022): Completely eliminates backpropagation. Each layer independently optimizes a local objective function: "is this input real data or fake data?" Only forward passes are performed -- twice, once with real data (positive) and once with intentionally generated incorrect data (negative) -- and no backward pathway exists at all. This avoids criticisms #1 (weight transport), #2 (global error), and #3 (separated phases). However, while backpropagation-based networks achieve over 95% accuracy on CIFAR-10, Forward-Forward hovers around 80%, making the performance gap its most significant limitation.

## Connections to Modern AI Techniques

The relationship between brain learning principles and AI learning algorithms falls into two categories.

**Reverse inspiration -- neuroscience critique catalyzing AI techniques:**

- Feedback alignment, predictive coding, equilibrium propagation, and Forward-Forward were all proposed in direct response to the neuroscience community's specific criticisms of backpropagation's biological implausibility (weight transport, global error, phase separation, symmetric weights). The structure is: neuroscience identifies a flaw in an AI technique, and that criticism becomes a design constraint for new AI techniques
- **Spiking Neural Networks (SNNs)**: Networks that directly implement the brain's STDP rule for learning. Intel's Loihi chip (2018) implemented STDP-based learning in neuromorphic hardware. With 128 cores and 130,000 neurons, it learns patterns using only local learning rules without backpropagation. It shows power consumption hundreds of times lower than conventional GPUs during inference, but classification accuracy does not match backpropagation-based networks

**Structural similarity -- independently developed but structurally similar:**

- **Hebb's rule and unsupervised learning**: Oja (1982) added a normalization term to Hebb's rule to solve the problem of weights growing without bound. The update rule is dw = lr * (x * y - y^2 * w), subtracting a decay term (y^2 * w) from the original Hebbian term (x * y). This turned out to be mathematically equivalent to an online version of Principal Component Analysis (PCA). While inspired by Hebb's rule, the final result converges to the same output as eigenvalue decomposition from linear algebra -- a mathematical convergence rather than a biological connection
- **Contrastive Hebbian Learning**: The Boltzmann machine's learning rule updates weights based on the difference in pairwise neuron correlations between free and clamped phases. While similar in form to Hebb's rule, the Boltzmann machine by Ackley, Hinton & Sejnowski (1985) was independently derived from statistical mechanics

## Limitations and Weaknesses

- **Asymmetric comparison criteria**: Backpropagation is optimized for supervised learning, but brain learning is mostly unsupervised or self-supervised. The brain has no teacher providing correct labels. Comparing them on supervised benchmarks like CIFAR-10 may itself be unfair
- **Scaling unknowns**: Backpropagation's success is most pronounced at the scale of billions of parameters. Biological alternatives have been validated only in small-scale experiments like MNIST (60,000 handwritten digits) or CIFAR-10 (60,000 everyday object images), and scaling to ImageNet (14 million images) or large language models remains an open question
- **Biological plausibility as a spectrum**: "Biologically plausible" is a continuous spectrum, not a binary. Feedback alignment solves the weight transport problem but still uses separated phases. Forward-Forward eliminates the backward pathway but introduces a non-biological element in the positive/negative data distinction. Equilibrium propagation eliminates separated phases but assumes symmetric weights. No method yet addresses all four criticisms simultaneously
- **Does the brain optimize?**: Backpropagation presumes optimization of an explicit loss function. Whether the brain optimizes a specific loss function or uses fundamentally different computational principles (such as a general principle like free energy minimization) is an open question. If this premise is wrong, the search for "biological alternatives to backpropagation" may itself be asking the wrong question

## Glossary

Synaptic plasticity - the property of the brain where synaptic connection strength changes with experience; the neurological basis of learning and memory

Long-Term Potentiation (LTP) - a phenomenon where synaptic transmission efficiency increases persistently for hours to weeks following high-frequency stimulation; discovered by Bliss & Lomo (1973)

Long-Term Depression (LTD) - a phenomenon where synaptic transmission efficiency decreases following low-frequency stimulation; the opposite direction of LTP, and their balance maintains learning stability

Spike-Timing-Dependent Plasticity (STDP) - a rule where synaptic strength changes based on the timing difference (in milliseconds) between pre- and postsynaptic neuron firing; discovered by Markram (1997)

Backpropagation - an algorithm computing gradients of output error with respect to each weight backward through the chain rule; formalized by Linnainmaa (1970), proposed for neural networks by Werbos (1974), popularized by Rumelhart, Hinton & Williams (1986)

Weight transport problem - the assumption that backpropagation requires the exact transpose (W^T) of the forward weight matrix in the backward pathway; biological synapses have no mechanism to implement this

Feedback alignment - a method showing that learning works with random fixed matrices in the backward pathway, as forward weights gradually align with the feedback matrix; Lillicrap et al. (2016)

Predictive coding - the theory that the brain predicts sensory input and propagates only prediction errors to higher regions, enabling local learning without global error signals; Rao & Ballard (1999)

Chain rule - the calculus rule decomposing the derivative of a composite function into a product of constituent function derivatives; the mathematical foundation of backpropagation

Forward-Forward algorithm - a method training each layer independently to distinguish positive from negative data without any backward pathway; proposed by Hinton (2022)

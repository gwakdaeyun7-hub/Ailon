---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 시각 피질, 합성곱 신경망, 수용 영역, 단순 세포, 복합 세포, 네오코그니트론, 계층적 특징 추출, 레티노토피
keywords_en: visual cortex, convolutional neural network, receptive field, simple cell, complex cell, neocognitron, hierarchical feature extraction, retinotopy
---
Visual Cortex Hierarchy and Convolutional Neural Networks - 고양이 시각 피질의 계층 구조에서 직접 영감을 받아 탄생한, AI 역사상 가장 성공적인 학제간 전이 사례

## 고양이의 눈에서 시작된 혁명

1959년, 하버드 대학의 신경과학자 David Hubel과 Torsten Wiesel은 마취된 고양이의 시각 피질(visual cortex)에 미세 전극을 삽입하고, 스크린에 다양한 빛 패턴을 보여주며 개별 뉴런의 반응을 기록했다. 처음에는 점 형태의 빛에 반응하는 뉴런을 찾으려 했지만, 우연히 슬라이드를 교체하는 과정에서 슬라이드 가장자리가 만든 직선 그림자에 특정 뉴런이 폭발적으로 반응하는 것을 발견했다.

이 우연한 관찰이 시각 신경과학의 패러다임을 바꾸었다. Hubel과 Wiesel은 시각 피질의 뉴런이 두 가지 뚜렷한 유형으로 나뉜다는 것을 밝혔다.

- **단순 세포**: 특정 방향의 직선 에지에 반응한다. 수평선에만 반응하는 뉴런, 45도 대각선에만 반응하는 뉴런이 각각 존재한다. 이 뉴런들은 정확한 위치에 민감하다.
- **복합 세포**: 역시 특정 방향의 에지에 반응하지만, 에지가 수용 영역 내에서 어디에 있든 반응한다. 위치 불변성(position invariance)을 보인다.

1962년 후속 연구에서 두 사람은 시각 피질이 **계층 구조**로 조직되어 있음을 보였다. V1(일차 시각 피질)의 단순 세포가 에지를 감지하면, 이 정보가 복합 세포로 전달되어 위치에 무관한 에지 표현이 만들어지고, 상위 영역(V2, V4, IT)으로 갈수록 점점 더 복잡하고 추상적인 시각 특징이 표현된다. 이 발견으로 두 사람은 1981년 노벨 생리학·의학상을 수상했다.

## 수용 영역: 핵심 개념

시각 피질을 이해하는 열쇠는 **수용 영역**이다. 하나의 뉴런이 반응하는 시야 내 영역을 뜻한다. 망막에 가까운 뉴런일수록 수용 영역이 작고(세밀한 지역 정보 처리), 상위 영역으로 갈수록 수용 영역이 커진다(넓은 맥락 통합).

이것은 단순한 크기 변화가 아니다. 질적 전환이 동반된다. V1의 뉴런은 작은 수용 영역에서 에지와 방향을 감지한다. V2는 윤곽과 텍스처 패턴을 처리한다. V4는 곡선과 색상 조합을 인식한다. 하측두 피질(IT cortex)의 뉴런은 얼굴, 손, 특정 물체 같은 고수준 개념에 반응한다. 이 계층을 올라갈수록 표현이 더 추상적이고 불변적(invariant)이 되는 패턴이 CNN 설계의 직접적 청사진이 되었다.

또한 시각 피질은 레티노토피 구조(retinotopic mapping)를 유지한다. 망막의 인접한 점들이 피질에서도 인접하게 표현된다. 공간적 이웃 관계가 보존되는 이 성질이, CNN이 공간 구조를 유지하며 처리하는 설계의 생물학적 근거다.

## 네오코그니트론에서 CNN으로

Hubel과 Wiesel의 발견이 AI로 번역되기까지 두 번의 결정적 도약이 있었다.

첫 번째 도약 -- 네오코그니트론(1980): 일본의 Kunihiko Fukushima는 Hubel-Wiesel 모델을 직접 참조하여 네오코그니트론(Neocognitron)을 설계했다. S-세포(단순 세포 대응)는 특정 패턴을 감지하고, C-세포(복합 세포 대응)는 위치 변동을 흡수했다. 이 구조는 핵심 아이디어에서 CNN의 원형이었다. 하지만 학습 규칙이 비지도 학습 기반이어서, 복잡한 패턴 인식에 한계가 있었다.

두 번째 도약 -- LeNet(1989, 1998): Yann LeCun et al.은 Fukushima의 구조에 역전파(backpropagation)를 결합했다. LeNet-5(1998)는 우편번호 손글씨 인식에서 실용적 성공을 거두며 CNN의 가능성을 입증했다. 핵심 혁신은 합성곱 필터의 가중치를 경사하강법으로 학습할 수 있게 한 것이다.

그리고 AlexNet의 돌파(2012): Krizhevsky, Sutskever, Hinton이 ImageNet 대회에서 기존 방법 대비 오류율을 10% 이상 줄이며 심층 CNN의 시대를 열었다. GPU 병렬 연산, ReLU 활성화 함수, 드롭아웃이 결합되어 깊은 CNN 학습이 가능해진 것이다.

## 생물학에서 알고리즘으로: 대응 관계

시각 피질과 CNN 사이의 핵심 대응 관계를 정리하면 다음과 같다.

- 단순 세포 (방향 선택적 에지 감지) --> **합성곱 필터** (학습된 특징 검출기)
- 복합 세포 (위치 불변 반응) --> **풀링 레이어** (max pooling, average pooling)
- 수용 영역 크기의 계층적 증가 --> **더 깊은 레이어 = 더 큰 수용 영역**
- V1 → V2 → V4 → IT 계층 --> **얕은 층(에지) → 중간 층(텍스처) → 깊은 층(객체)**
- 레티노토피 구조 --> **합성곱의 공간 구조 보존** (특징 맵이 입력의 공간 배치를 유지)

합성곱 연산의 수식은 다음과 같다.

(f * g)(t) = sum_{tau} f(tau) * g(t - tau)

2D 특징 맵(feature map) 계산에서 각 출력 위치 (i,j)의 값은 다음과 같다.

h_{i,j} = sigma(sum_m sum_n w_{m,n} * x_{i+m, j+n} + b)

여기서 w는 필터 가중치, x는 입력, b는 편향, sigma는 활성화 함수다. 동일한 필터(가중치 공유)가 입력의 모든 위치를 슬라이딩하며 적용되는 것이 합성곱의 핵심이며, 이것은 시각 피질에서 같은 유형의 단순 세포가 시야의 여러 위치에 분포하는 것과 구조적으로 대응된다.

## 역방향 검증: CNN이 뇌를 예측하다

놀라운 후속 발견이 이 영감의 방향을 확인해 주었다. Yamins et al.(2014)은 ImageNet으로 학습된 CNN의 중간 레이어 활성화 패턴이 원숭이 시각 피질의 V4와 IT 영역 뉴런 반응과 높은 상관관계를 보인다는 것을 발견했다. CNN이 시각 피질을 모방하려고 설계된 것이 아니라, 같은 과제(객체 인식)를 풀다 보니 유사한 표현을 발견한 것이다. 이것은 계층적 특징 추출이 시각 과제의 보편적 해법일 수 있음을 시사한다.

Zeiler & Fergus(2014)의 시각화 연구도 이를 뒷받침한다. CNN의 첫 번째 레이어는 Gabor 필터와 유사한 에지 검출기를 학습하고(V1 단순 세포와 유사), 중간 레이어는 텍스처와 부분 패턴을, 깊은 레이어는 전체 객체를 인식한다. 학습을 통해 생물학적 시각 계층과 유사한 구조가 자발적으로 출현한 것이다.

## 현대 CNN 아키텍처의 진화

시각 피질 영감에서 출발한 CNN은 이후 생물학에서 크게 벗어나며 독자적으로 진화했다.

- ResNet(He et al., 2015): 잔차 연결(residual connection)로 100층 이상의 네트워크를 학습 가능하게 했다. 생물학적 시각 피질은 이렇게 깊지 않다.
- EfficientNet(Tan & Le, 2019): 깊이, 너비, 해상도를 체계적으로 스케일링하는 복합 스케일링 법칙을 제시했다.
- **Vision Transformer**(Dosovitskiy et al., 2020): 이미지를 패치로 분할하여 Transformer로 처리한다. 합성곱이라는 귀납적 편향(inductive bias)을 제거하고도 대규모 데이터에서 CNN을 능가했다. 시각 피질 영감의 직접적 계보에서 벗어난 사례다.

## 한계와 약점

시각 피질과 CNN 사이의 유비는 강력하지만, 본질적으로 다른 점들을 간과해서는 안 된다.

- 피드백 연결의 부재: 생물학적 시각 피질에서 하향 피드백(top-down feedback) 연결은 상향 연결만큼이나 풍부하다. V1으로 가는 입력의 약 80%가 상위 영역에서 온다. 표준 CNN은 순방향(feedforward)만 존재한다. 이 차이는 맥락 의존적 지각(예: 착시 현상에서 기대가 지각을 바꾸는 것)을 CNN이 재현하지 못하는 이유와 관련된다.
- 측면 연결의 부재: 같은 계층 내 뉴런 간 상호 억제와 흥분(lateral inhibition/excitation)이 시각 피질에서 중요한 역할을 하지만, 표준 CNN에는 없다.
- 역전파의 비생물학성: CNN 학습에 사용되는 역전파는 생물학적으로 일어나지 않는다. 시각 피질의 학습은 지역적(local) 시냅스 가소성에 기반한다.
- 텍스처 편향: Geirhos et al.(2019)은 ImageNet 학습 CNN이 인간과 달리 형태(shape)보다 텍스처(texture)에 의존한다는 것을 보였다. 코끼리 텍스처를 고양이 형태에 입히면 CNN은 코끼리라 답하지만, 인간은 고양이라 답한다.
- 적대적 예제: 인간이 전혀 인식하지 못하는 미세한 픽셀 변조로 CNN의 분류를 완전히 바꿀 수 있다. 생물학적 시각 시스템은 이런 공격에 본질적으로 강건하다. 이것은 CNN이 시각 피질과 근본적으로 다른 표현을 학습하고 있음을 시사한다.

## 용어 정리

시각 피질(visual cortex) - 후두엽에 위치한 대뇌 피질 영역으로, 시각 정보를 계층적으로 처리하는 뇌 구조

단순 세포(simple cell) - V1 시각 피질에서 특정 방향의 에지에 위치 특이적으로 반응하는 뉴런

복합 세포(complex cell) - 특정 방향의 에지에 반응하되, 수용 영역 내 위치에 무관하게 반응하는 뉴런

수용 영역(receptive field) - 하나의 뉴런이 반응하는 감각 공간(시야) 내의 특정 영역

레티노토피(retinotopy) - 망막의 공간 배치가 시각 피질에서도 보존되는 위상 구조적 대응

합성곱 필터(convolutional filter) - 입력 위를 슬라이딩하며 동일 가중치로 특징을 추출하는 CNN의 기본 연산 단위

풀링(pooling) - 특징 맵의 공간 해상도를 줄여 위치 불변성을 부여하는 연산. 복합 세포의 기능적 대응물

특징 맵(feature map) - 하나의 합성곱 필터가 입력 전체에 적용되어 생성한 2D 활성화 패턴

귀납적 편향(inductive bias) - 모델 구조에 내재된 가정으로, CNN의 경우 공간적 지역성과 이동 불변성이 해당

적대적 예제(adversarial example) - 인간에게는 감지할 수 없지만 모델의 예측을 크게 바꾸는 의도적 입력 변조

---EN---
Visual Cortex Hierarchy and Convolutional Neural Networks - The most successful interdisciplinary transfer in AI history, directly inspired by the hierarchical organization of the cat visual cortex

## A Revolution That Started in a Cat's Eye

In 1959, neuroscientists David Hubel and Torsten Wiesel at Harvard inserted microelectrodes into the visual cortex of anesthetized cats and recorded individual neuron responses while projecting various light patterns onto a screen. They initially sought neurons responding to point-like stimuli, but serendipitously discovered that certain neurons fired vigorously in response to the straight-edged shadow cast by a glass slide being swapped.

This accidental observation transformed visual neuroscience. Hubel and Wiesel revealed that visual cortex neurons fall into two distinct types:

- **Simple cells**: Respond to straight edges at specific orientations. Some neurons fire only for horizontal lines, others only for 45-degree diagonals. These neurons are sensitive to exact position.
- **Complex cells**: Also respond to edges at specific orientations, but fire regardless of where the edge falls within their receptive field. They exhibit position invariance.

In their 1962 follow-up, the pair showed that the visual cortex is organized as a **hierarchy**. Simple cells in V1 (primary visual cortex) detect edges, this information feeds into complex cells that create position-invariant edge representations, and progressively higher areas (V2, V4, IT) represent increasingly complex and abstract visual features. This discovery earned them the 1981 Nobel Prize in Physiology or Medicine.

## Receptive Field: The Key Concept

The key to understanding the visual cortex is the **receptive field** -- the region of the visual field to which a single neuron responds. Neurons closer to the retina have smaller receptive fields (processing fine local information), while higher areas have progressively larger receptive fields (integrating broader context).

This is not merely a change in size -- it involves a qualitative transformation. V1 neurons detect edges and orientations in small receptive fields. V2 processes contours and texture patterns. V4 recognizes curves and color combinations. Neurons in the inferotemporal cortex (IT) respond to high-level concepts like faces, hands, and specific objects. The pattern of representations becoming more abstract and invariant as one ascends this hierarchy became the direct blueprint for CNN design.

The visual cortex also maintains retinotopic mapping -- adjacent points on the retina are represented adjacently in the cortex. This preservation of spatial neighbor relationships is the biological basis for CNNs' design of preserving spatial structure during processing.

## From Neocognitron to CNN

Two decisive leaps were required to translate Hubel and Wiesel's discoveries into AI.

First leap -- Neocognitron (1980): Japan's Kunihiko Fukushima directly referenced the Hubel-Wiesel model to design the Neocognitron. S-cells (corresponding to simple cells) detected specific patterns, and C-cells (corresponding to complex cells) absorbed positional variation. Conceptually, this was the prototype of CNNs. However, its unsupervised learning rule limited its ability to recognize complex patterns.

Second leap -- LeNet (1989, 1998): Yann LeCun et al. combined Fukushima's architecture with backpropagation. LeNet-5 (1998) proved CNN's practical viability by successfully recognizing handwritten zip codes. The key innovation was making convolutional filter weights learnable through gradient descent.

AlexNet breakthrough (2012): Krizhevsky, Sutskever, and Hinton reduced error rates by over 10% compared to previous methods on ImageNet, ushering in the era of deep CNNs. The combination of GPU parallelism, ReLU activation, and dropout made training deep CNNs feasible.

## Biology to Algorithm: The Correspondences

The key correspondences between the visual cortex and CNNs are:

- Simple cells (orientation-selective edge detection) --> **convolutional filters** (learned feature detectors)
- Complex cells (position-invariant response) --> **pooling layers** (max pooling, average pooling)
- Hierarchical increase in receptive field size --> **deeper layers = larger receptive fields**
- V1 → V2 → V4 → IT hierarchy --> **shallow layers (edges) → middle layers (textures) → deep layers (objects)**
- Retinotopic mapping --> **spatial structure preservation in convolution** (feature maps maintain the input's spatial arrangement)

The convolution formula is:

(f * g)(t) = sum_{tau} f(tau) * g(t - tau)

For a 2D feature map, the value at each output position (i,j) is:

h_{i,j} = sigma(sum_m sum_n w_{m,n} * x_{i+m, j+n} + b)

Here w represents filter weights, x the input, b the bias, and sigma the activation function. The same filter (weight sharing) slides across all input positions -- this is the essence of convolution, and it structurally corresponds to the same type of simple cells being distributed across multiple locations in the visual field.

## Reverse Validation: CNNs Predicting the Brain

A remarkable follow-up discovery confirmed the direction of this inspiration. Yamins et al. (2014) found that intermediate layer activations of ImageNet-trained CNNs showed high correlation with neuron responses in monkey visual cortex areas V4 and IT. The CNN was not designed to mimic the visual cortex -- rather, solving the same task (object recognition) led to discovering similar representations. This suggests that hierarchical feature extraction may be a universal solution to visual tasks.

Zeiler & Fergus's (2014) visualization study supports this further. A CNN's first layer learns edge detectors resembling Gabor filters (similar to V1 simple cells), middle layers capture textures and partial patterns, and deep layers recognize whole objects. The biological visual hierarchy spontaneously emerged through learning.

## Modern CNN Architecture Evolution

CNNs that originated from visual cortex inspiration have since diverged significantly from biology, evolving independently.

- ResNet (He et al., 2015): Residual connections enabled training networks with over 100 layers. The biological visual cortex is not nearly this deep.
- EfficientNet (Tan & Le, 2019): Introduced compound scaling laws that systematically scale depth, width, and resolution.
- **Vision Transformer** (Dosovitskiy et al., 2020): Splits images into patches and processes them with Transformers. It surpassed CNNs on large-scale data even after removing convolution's inductive bias -- a departure from the direct lineage of visual cortex inspiration.

## Limitations and Weaknesses

The analogy between visual cortex and CNNs is powerful, but essentially different aspects must not be overlooked.

- Absence of feedback connections: In the biological visual cortex, top-down feedback connections are as abundant as feedforward connections. Approximately 80% of input to V1 comes from higher areas. Standard CNNs are purely feedforward. This difference relates to why CNNs cannot reproduce context-dependent perception (e.g., expectations altering perception in optical illusions).
- Absence of lateral connections: Mutual inhibition and excitation between neurons within the same layer (lateral inhibition/excitation) play important roles in the visual cortex but are absent in standard CNNs.
- Biological implausibility of backpropagation: Backpropagation used for CNN training does not occur biologically. Visual cortex learning relies on local synaptic plasticity.
- Texture bias: Geirhos et al. (2019) showed that ImageNet-trained CNNs rely on texture rather than shape, unlike humans. When elephant texture is applied to a cat shape, CNNs answer "elephant" while humans answer "cat."
- Adversarial examples: Imperceptible pixel perturbations can completely change CNN classifications. The biological visual system is inherently robust to such attacks. This suggests CNNs learn fundamentally different representations from the visual cortex.

## Glossary

Visual cortex - the cerebral cortex region in the occipital lobe that hierarchically processes visual information

Simple cell - a V1 visual cortex neuron that responds to edges at a specific orientation in a position-specific manner

Complex cell - a neuron that responds to edges at a specific orientation regardless of position within its receptive field

Receptive field - the specific region in sensory space (visual field) to which a single neuron responds

Retinotopy - the topographic correspondence where spatial arrangement on the retina is preserved in the visual cortex

Convolutional filter - the basic computational unit of a CNN that slides across input with shared weights to extract features

Pooling - an operation that reduces spatial resolution of feature maps to confer position invariance, the functional counterpart of complex cells

Feature map - the 2D activation pattern generated by applying a single convolutional filter across the entire input

Inductive bias - assumptions embedded in model architecture; for CNNs, these include spatial locality and translation invariance

Adversarial example - intentional input perturbation imperceptible to humans that drastically changes a model's prediction
